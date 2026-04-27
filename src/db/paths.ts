import os from 'node:os'
import path from 'node:path'

const APP_NAME = 'penumbra'

function platformDataDir(): string {
  const home = os.homedir()
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', APP_NAME)
  }
  if (process.platform === 'win32') {
    const base =
      process.env.LOCALAPPDATA && process.env.LOCALAPPDATA.length > 0
        ? process.env.LOCALAPPDATA
        : path.join(home, 'AppData', 'Local')
    return path.join(base, APP_NAME)
  }
  const xdg =
    process.env.XDG_DATA_HOME && process.env.XDG_DATA_HOME.length > 0
      ? process.env.XDG_DATA_HOME
      : path.join(home, '.local', 'share')
  return path.join(xdg, APP_NAME)
}

export function resolveAppDataDir(): string {
  if (process.env.PENUMBRA_DATA_DIR && process.env.PENUMBRA_DATA_DIR.length > 0) {
    return path.resolve(process.env.PENUMBRA_DATA_DIR)
  }
  if (process.env.NODE_ENV === 'production') {
    return platformDataDir()
  }
  return path.resolve('./.penumbra')
}

export function resolveDatabasePath(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0) {
    return path.resolve(process.env.DATABASE_URL)
  }
  return path.join(resolveAppDataDir(), 'penumbra.db')
}

export function resolveAssetsDir(): string {
  if (process.env.PENUMBRA_ASSETS_DIR && process.env.PENUMBRA_ASSETS_DIR.length > 0) {
    return path.resolve(process.env.PENUMBRA_ASSETS_DIR)
  }
  return path.join(resolveAppDataDir(), 'assets')
}

export function resolveBackupStagingDir(): string {
  return path.join(resolveAppDataDir(), '.backup-staging')
}

const SHA256_HEX = /^[a-f0-9]{64}$/

export function assetPathForSha(sha256: string): string {
  if (!SHA256_HEX.test(sha256)) {
    throw new Error(
      `assetPathForSha: expected lowercase hex sha256, got ${JSON.stringify(sha256)}`,
    )
  }
  return path.join(
    resolveAssetsDir(),
    sha256.slice(0, 2),
    sha256.slice(2, 4),
    sha256,
  )
}
