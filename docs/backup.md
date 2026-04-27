# Backup & restore architecture

This document captures the agreed design and load-bearing invariants for a built-in
backup/restore tool. None of the actual backup logic is implemented yet — this is the
contract every related piece of code (path resolvers, asset storage, GC, future
`createBackup` / `restoreBackup` server fns) must honor so that backup is a small,
mechanical addition rather than a refactor.

## Goals

- One command produces a self-contained, restorable archive of the entire app state at a
  point in time.
- Restorable on a different machine of the same OS (or after a fresh install) by
  extracting the archive and pointing the app at it.
- Concurrency-safe with a running app — taking a backup must neither corrupt nor block
  ongoing writes.
- Stable across schema versions: a backup taken on app v1 must restore on a later
  schema version after Drizzle migrations run.

## Single source of state

Every persistent byte lives under `resolveAppDataDir()`:

- `penumbra.db` — Drizzle / SQLite database
- `assets/` — content-addressed binary files (scans, photos, …)
- `.backup-staging/` — transient working dir used during backup creation

No state lives outside that directory. No `~/.penumbra*`, no project-root sidecars, no
OS keychain. This is the load-bearing invariant that makes "back up the dir" sufficient.

## Asset storage contract

The backup tool depends on these properties of `assets/`:

1. **Content-addressed.** Filename = sha256 of the contents, in fanout layout
   `assets/<sha[0:2]>/<sha[2:4]>/<sha>`. The DB stores `sha256` (text, lowercase hex);
   composing the on-disk path is a pure function — `assetPathForSha()` in
   `src/db/paths.ts`.
2. **Immutable.** Files are written once and never modified in place. Re-uploading
   identical content is a no-op (target file already exists). This eliminates "what if
   the file changes mid-backup" races.
3. **Lazily garbage-collected.** When a row is deleted, the file is not. A separate GC
   pass identifies unreferenced files and removes them.
4. **Lockable GC.** The GC pass acquires an advisory lock that the backup tool also
   takes, so GC cannot delete a file the backup is about to copy. The lock is a small
   primitive (a file at `<appDataDir>/.gc-lock` plus an in-process mutex).

## Database snapshot

Never copy `penumbra.db` directly while the app is live — WAL mode means `.db` alone is
incomplete and `.db-wal` / `.db-shm` are tied to the live inode. The backup tool must
use one of:

- `VACUUM INTO '<staging>/penumbra.db'` (preferred — also compacts free pages, single
  call from Drizzle)
- `db.backup(stagingPath)` from `better-sqlite3` (uses the SQLite online backup API)

Both produce a self-contained, consistent file regardless of concurrent writers. The
WAL/SHM files are intentionally **not** included in the backup archive.

## Backup format

```
penumbra-backup-<ISO timestamp>.tar.zst
├── manifest.json
├── penumbra.db          # via VACUUM INTO
└── assets/
    └── aa/bb/<sha256>   # only assets referenced by penumbra.db (default)
```

`manifest.json` shape (typed in `src/lib/backup.ts` as `BackupManifest`):

```json
{
  "backupFormatVersion": 1,
  "appVersion": "0.1.0",
  "schemaVersion": "<latest drizzle migration tag>",
  "createdAt": "2026-04-27T12:34:56.789Z",
  "db":     { "bytes": 65536 },
  "assets": { "count": 142, "totalBytes": 1234567890 }
}
```

`backupFormatVersion` lets future tooling read older backups. `schemaVersion` lets
restore detect "this backup is from a newer schema than my code can handle" and bail
before damage.

## Backup workflow (target shape)

1. Acquire asset-GC lock.
2. Ensure staging dir exists (`resolveBackupStagingDir()`); clear any prior contents.
3. `VACUUM INTO '<staging>/penumbra.db'`.
4. From the staging DB, `SELECT sha256 FROM assets`.
5. Hardlink each referenced asset from `<assets>/aa/bb/<sha>` to
   `<staging>/assets/aa/bb/<sha>`. Hardlink (same filesystem, near-zero cost) is safe
   because asset files are immutable.
6. Write `<staging>/manifest.json`.
7. `tar -cf - <staging> | zstd -19 -o <output>.tar.zst` (or pure-Node equivalent).
8. Release GC lock; clean staging.

## Restore workflow (target shape)

Two modes:

- **In-place** — stop the app, extract the archive over `resolveAppDataDir()`, restart.
  App startup runs Drizzle migrations to bring the DB schema forward if needed.
- **Side-by-side preview** — extract to a temp dir, launch the app with
  `PENUMBRA_DATA_DIR=<temp>`. Lets the user inspect a backup before committing.

Restore must:

1. Read `manifest.json`. If `backupFormatVersion` is unknown, refuse.
2. If `schemaVersion` is *newer* than the latest migration the running code knows,
   refuse — downgrade is unsafe.
3. Verify each `assets/` file's name matches its sha256 (cheap integrity check).
4. After install, run Drizzle migrations on the restored DB.

## Out of scope (for v1)

- **Incremental / delta backups.** Single-user app, full snapshots are fine.
- **Encryption.** Wrap with `age` or PGP later if desired.
- **Cloud sync.** Defer to OS (Time Machine) or user's choice (place backup file in a
  synced folder).
- **Cross-engine restore.** SQLite-only.

## Implementation prerequisites

When backup/restore lands, these must already exist:

- `assets` table in `src/db/schema.ts` with `sha256` (text), `bytes`, `mime`, owner FK.
- Asset upload server fn that hashes input → writes to `assetPathForSha(sha)` →
  inserts the row in one transaction. Re-upload of identical content is a no-op write
  but still inserts a row (referenced count increases).
- Asset GC server fn with the lockable mutex described above.
- `src/server/backup.ts` — `createBackup` and `restoreBackup` server fns.

The pieces that are already in place: `resolveAppDataDir()` /
`resolveDatabasePath()` / `resolveAssetsDir()` / `resolveBackupStagingDir()` /
`assetPathForSha()` in `src/db/paths.ts`, and `BackupManifest` /
`BACKUP_FORMAT_VERSION` / filename constants in `src/lib/backup.ts`.
