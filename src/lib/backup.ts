export const BACKUP_FORMAT_VERSION = 1

export type BackupManifest = {
  backupFormatVersion: typeof BACKUP_FORMAT_VERSION
  appVersion: string
  schemaVersion: string
  createdAt: string
  db: { bytes: number }
  assets: { count: number; totalBytes: number }
}

export const BACKUP_MANIFEST_FILENAME = 'manifest.json'
export const BACKUP_DB_FILENAME = 'penumbra.db'
export const BACKUP_ASSETS_DIRNAME = 'assets'
