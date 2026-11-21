/**
 * SQLite Service for SOMLENG Web App (PWA)
 * Uses WebAssembly-powered SQLite (sql.js) with persistent binary storage in IndexedDB.
 */
import initSqlJs, { type Database } from 'sql.js'

export interface DownloadedTrack {
  id: string
  title: string
  channel: string
  thumb: string
  duration?: string
  downloaded_at: number
}

const IDB_NAME = 'somleng_pwa_db'
const IDB_STORE = 'sqlite_storage'
const IDB_KEY = 'somleng_sqlite_binary'

// IndexedDB Helper to persist SQLite Uint8Array database binary
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'))
    }
    const request = indexedDB.open(IDB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function loadDbFromIndexedDB(): Promise<Uint8Array | null> {
  try {
    const idb = await openIndexedDB()
    return new Promise((resolve) => {
      const tx = idb.transaction(IDB_STORE, 'readonly')
      const store = tx.objectStore(IDB_STORE)
      const request = store.get(IDB_KEY)
      request.onsuccess = () => {
        resolve(request.result ? (request.result as Uint8Array) : null)
      }
      request.onerror = () => resolve(null)
    })
  } catch (e) {
    console.warn('[SQLite] Could not load from IndexedDB:', e)
    return null
  }
}

async function saveDbToIndexedDB(data: Uint8Array): Promise<void> {
  try {
    const idb = await openIndexedDB()
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readwrite')
      const store = tx.objectStore(IDB_STORE)
      const request = store.put(data, IDB_KEY)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    console.warn('[SQLite] Could not save to IndexedDB:', e)
  }
}

let dbInstance: Database | null = null
let initPromise: Promise<Database> | null = null
let sqlJsPromise: ReturnType<typeof initSqlJs> | null = null

function loadSqlJs() {
  if (!sqlJsPromise) {
    sqlJsPromise = (async () => {
      const wasmUrl = new URL('sql-wasm.wasm', document.baseURI)
      wasmUrl.searchParams.set('v', '2')
      const response = await fetch(wasmUrl)
      if (!response.ok) {
        throw new Error(`Failed to load SQLite WebAssembly (${response.status} ${response.statusText})`)
      }

      const wasmBinary = await response.arrayBuffer()
      const magic = new Uint8Array(wasmBinary, 0, Math.min(wasmBinary.byteLength, 4))
      if (magic.length !== 4 || magic[0] !== 0x00 || magic[1] !== 0x61 || magic[2] !== 0x73 || magic[3] !== 0x6d) {
        throw new Error(`Invalid SQLite WebAssembly response from ${wasmUrl.href}. Clear the site's cached data and reload.`)
      }

      return initSqlJs({ wasmBinary })
    })().catch((error) => {
      sqlJsPromise = null
      throw error
    })
  }

  return sqlJsPromise
}

export async function getSqliteDb(): Promise<Database> {
  if (dbInstance) return dbInstance
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      const SQL = await loadSqlJs()

      const existingData = await loadDbFromIndexedDB()
      if (existingData) {
        dbInstance = new SQL.Database(existingData)
        console.log('[SQLite] Loaded existing SQLite database from IndexedDB')
      } else {
        dbInstance = new SQL.Database()
        console.log('[SQLite] Initialized new in-memory SQLite database')
      }

      // Ensure downloads table exists
      dbInstance.run(`
        CREATE TABLE IF NOT EXISTS downloads (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          channel TEXT,
          thumb TEXT,
          duration TEXT,
          downloaded_at INTEGER
        );
      `)

      await persistDatabase()
      return dbInstance
    } catch (err) {
      console.error('[SQLite] Failed to initialize SQLite engine:', err)
      initPromise = null
      throw err
    }
  })()

  return initPromise
}

export async function persistDatabase(): Promise<void> {
  if (!dbInstance) return
  try {
    const binaryArray = dbInstance.export()
    await saveDbToIndexedDB(binaryArray)
  } catch (e) {
    console.error('[SQLite] Error persisting database binary:', e)
  }
}

export async function fetchAllDownloads(): Promise<DownloadedTrack[]> {
  const db = await getSqliteDb()
  const res = db.exec(`
    SELECT id, title, channel, thumb, duration, downloaded_at
    FROM downloads
    ORDER BY downloaded_at DESC;
  `)

  if (!res.length || !res[0].values) return []

  const cols = res[0].columns
  const idIdx = cols.indexOf('id')
  const titleIdx = cols.indexOf('title')
  const chanIdx = cols.indexOf('channel')
  const thumbIdx = cols.indexOf('thumb')
  const durIdx = cols.indexOf('duration')
  const dateIdx = cols.indexOf('downloaded_at')

  return res[0].values.map((row) => ({
    id: String(row[idIdx] || ''),
    title: String(row[titleIdx] || ''),
    channel: String(row[chanIdx] || ''),
    thumb: String(row[thumbIdx] || ''),
    duration: row[durIdx] ? String(row[durIdx]) : undefined,
    downloaded_at: Number(row[dateIdx] || Date.now())
  }))
}

export async function addDownloadToSqlite(track: {
  id: string
  title: string
  channel: string
  thumb: string
  duration?: string
}): Promise<boolean> {
  const db = await getSqliteDb()
  const downloadedAt = Date.now()

  db.run(
    `INSERT OR REPLACE INTO downloads (id, title, channel, thumb, duration, downloaded_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [track.id, track.title, track.channel, track.thumb, track.duration || null, downloadedAt]
  )

  await persistDatabase()
  return true
}

export async function removeDownloadFromSqlite(trackId: string): Promise<boolean> {
  const db = await getSqliteDb()
  db.run(`DELETE FROM downloads WHERE id = ?;`, [trackId])
  await persistDatabase()
  return true
}

export async function isTrackDownloaded(trackId: string): Promise<boolean> {
  const db = await getSqliteDb()
  const stmt = db.prepare(`SELECT id FROM downloads WHERE id = ? LIMIT 1;`)
  stmt.bind([trackId])
  const exists = stmt.step()
  stmt.free()
  return exists
}

export async function clearAllSqliteDownloads(): Promise<boolean> {
  const db = await getSqliteDb()
  db.run(`DELETE FROM downloads;`)
  await persistDatabase()
  return true
}

export async function exportSqliteDatabaseBlob(): Promise<Blob> {
  const db = await getSqliteDb()
  const binaryArray = db.export()
  return new Blob([binaryArray.buffer as ArrayBuffer], { type: 'application/x-sqlite3' })
}

export async function importSqliteDatabase(buffer: ArrayBuffer): Promise<number> {
  const SQL = await loadSqlJs()
  const uint8 = new Uint8Array(buffer)
  const newDb = new SQL.Database(uint8)

  // Verify it has downloads table
  newDb.run(`
    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      channel TEXT,
      thumb TEXT,
      duration TEXT,
      downloaded_at INTEGER
    );
  `)

  dbInstance = newDb
  await persistDatabase()

  const list = await fetchAllDownloads()
  return list.length
}

export async function runQuerySqlite(query: string): Promise<{ columns: string[]; rows: any[][] }> {
  const db = await getSqliteDb()
  const res = db.exec(query)
  if (!res.length) {
    return { columns: [], rows: [] }
  }
  return {
    columns: res[0].columns,
    rows: res[0].values
  }
}
