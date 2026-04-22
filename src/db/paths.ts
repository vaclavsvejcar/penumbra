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

export function resolveDatabasePath(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0) {
    return path.resolve(process.env.DATABASE_URL)
  }
  if (process.env.NODE_ENV === 'production') {
    return path.join(platformDataDir(), 'penumbra.db')
  }
  return path.resolve('./penumbra.db')
}
