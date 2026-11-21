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
  sourceType: 'youtube' | 'local'
  fileName?: string
  mimeType?: string
  fileSize?: number
}

const IDB_NAME = 'somleng_pwa_db'
const IDB_STORE = 'sqlite_storage'
const IDB_KEY = 'somleng_sqlite_binary'
const AUDIO_STORE = 'audio_files'

// IndexedDB Helper to persist SQLite Uint8Array database binary
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'))
    }
    const request = indexedDB.open(IDB_NAME, 2)
    let blocked = false
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE)
      }
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE)
      }
    }
    request.onsuccess = () => {
      if (blocked) {
        request.result.close()
        return
      }
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
    request.onblocked = () => {
      blocked = true
      reject(new Error('Close other SOMLENG tabs, then try importing the MP3 again.'))
    }
    request.onerror = () => reject(request.error)
  })
}

async function loadDbFromIndexedDB(): Promise<Uint8Array | null> {
  try {
    const idb = await openIndexedDB()
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readonly')
      const store = tx.objectStore(IDB_STORE)
      const request = store.get(IDB_KEY)
      request.onsuccess = () => {
        resolve(request.result ? (request.result as Uint8Array) : null)
      }
      request.onerror = () => reject(request.error)
      tx.oncomplete = () => idb.close()
      tx.onerror = () => {
        idb.close()
        reject(tx.error)
      }
      tx.onabort = () => {
        idb.close()
        reject(tx.error)
      }
    })
  } catch (error) {
    console.error('[SQLite] Could not load from IndexedDB:', error)
    throw error
  }
}

async function saveDbToIndexedDB(data: Uint8Array): Promise<void> {
  const idb = await openIndexedDB()
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(data, IDB_KEY)
    tx.oncomplete = () => {
      idb.close()
      resolve()
    }
    tx.onerror = () => {
      idb.close()
      reject(tx.error)
    }
    tx.onabort = () => {
      idb.close()
      reject(tx.error)
    }
  })
}

async function getLegacyAudioFile(id: string): Promise<Blob | null> {
  const idb = await openIndexedDB()
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(AUDIO_STORE, 'readonly')
    const request = tx.objectStore(AUDIO_STORE).get(id)
    request.onsuccess = () => resolve((request.result as Blob | undefined) || null)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => idb.close()
    tx.onerror = () => {
      idb.close()
      reject(tx.error)
    }
    tx.onabort = () => {
      idb.close()
      reject(tx.error)
    }
  })
}

export type AudioImportPhase = 'reading' | 'saving' | 'complete'
export type AudioImportProgress = (progress: number, phase: AudioImportPhase) => void

function readAudioFile(file: File, onProgress?: AudioImportProgress): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100), 'reading')
      }
    }
    reader.onerror = () => reject(reader.error || new Error('Could not read the selected audio file.'))
    reader.onabort = () => reject(new Error('Audio file import was cancelled.'))
    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new Error('Could not read the selected audio file.'))
        return
      }
      onProgress?.(100, 'saving')
      resolve(new Uint8Array(reader.result))
    }
    reader.readAsArrayBuffer(file)
  })
}

export async function getLocalAudioFile(id: string): Promise<Blob | null> {
  const db = await getSqliteDb()
  const statement = db.prepare('SELECT audio_data, mime_type FROM downloads WHERE id = ? LIMIT 1;')
  statement.bind([id])
  let audioData: Uint8Array | null = null
  let mimeType = 'audio/mpeg'
  if (statement.step()) {
    const row = statement.getAsObject()
    const value = row.audio_data
    if (value instanceof Uint8Array) audioData = new Uint8Array(value)
    if (typeof row.mime_type === 'string' && row.mime_type) mimeType = row.mime_type
  }
  statement.free()

  if (audioData) {
    return new Blob([audioData.buffer as ArrayBuffer], { type: mimeType })
  }

  return getLegacyAudioFile(id)
}

async function removeAudioFile(id: string): Promise<void> {
  const idb = await openIndexedDB()
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(AUDIO_STORE, 'readwrite')
    tx.objectStore(AUDIO_STORE).delete(id)
    tx.oncomplete = () => {
      idb.close()
      resolve()
    }
    tx.onerror = () => {
      idb.close()
      reject(tx.error)
    }
    tx.onabort = () => {
      idb.close()
      reject(tx.error)
    }
  })
}

async function clearAudioFiles(): Promise<void> {
  const idb = await openIndexedDB()
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(AUDIO_STORE, 'readwrite')
    tx.objectStore(AUDIO_STORE).clear()
    tx.oncomplete = () => {
      idb.close()
      resolve()
    }
    tx.onerror = () => {
      idb.close()
      reject(tx.error)
    }
    tx.onabort = () => {
      idb.close()
      reject(tx.error)
    }
  })
}

function ensureDownloadsSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      channel TEXT,
      thumb TEXT,
      duration TEXT,
      downloaded_at INTEGER
    );
  `)

  const columns = new Set(
    (db.exec('PRAGMA table_info(downloads);')[0]?.values || [])
      .map(row => String(row[1]))
  )
  const migrations: Record<string, string> = {
    source_type: "TEXT NOT NULL DEFAULT 'youtube'",
    file_name: 'TEXT',
    mime_type: 'TEXT',
    file_size_bytes: 'INTEGER',
    audio_data: 'BLOB'
  }

  for (const [name, definition] of Object.entries(migrations)) {
    if (!columns.has(name)) {
      db.run(`ALTER TABLE downloads ADD COLUMN ${name} ${definition};`)
    }
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

      ensureDownloadsSchema(dbInstance)

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
  } catch (error) {
    console.error('[SQLite] Error persisting database binary:', error)
    throw error
  }
}

export async function fetchAllDownloads(): Promise<DownloadedTrack[]> {
  const db = await getSqliteDb()
  const res = db.exec(`
    SELECT id, title, channel, thumb, duration, downloaded_at,
           source_type, file_name, mime_type, file_size_bytes
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
  const sourceIdx = cols.indexOf('source_type')
  const nameIdx = cols.indexOf('file_name')
  const mimeIdx = cols.indexOf('mime_type')
  const sizeIdx = cols.indexOf('file_size_bytes')

  return res[0].values.map((row) => ({
    id: String(row[idIdx] || ''),
    title: String(row[titleIdx] || ''),
    channel: String(row[chanIdx] || ''),
    thumb: String(row[thumbIdx] || ''),
    duration: row[durIdx] ? String(row[durIdx]) : undefined,
    downloaded_at: Number(row[dateIdx] || Date.now()),
    sourceType: row[sourceIdx] === 'local' ? 'local' : 'youtube',
    fileName: row[nameIdx] ? String(row[nameIdx]) : undefined,
    mimeType: row[mimeIdx] ? String(row[mimeIdx]) : undefined,
    fileSize: row[sizeIdx] ? Number(row[sizeIdx]) : undefined
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
    `INSERT OR REPLACE INTO downloads
      (id, title, channel, thumb, duration, downloaded_at, source_type, file_name, mime_type, file_size_bytes)
     VALUES (?, ?, ?, ?, ?, ?, 'youtube', NULL, NULL, NULL);`,
    [track.id, track.title, track.channel, track.thumb, track.duration || null, downloadedAt]
  )

  await persistDatabase()
  return true
}

export async function addLocalAudioToSqlite(file: File, onProgress?: AudioImportProgress): Promise<DownloadedTrack> {
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  const supportedTypes: Record<string, string> = {
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    oga: 'audio/ogg',
    opus: 'audio/ogg',
    flac: 'audio/flac',
    webm: 'audio/webm'
  }
  const mimeType = file.type.startsWith('audio/') ? file.type : supportedTypes[extension]
  if (!mimeType || !file.size) {
    throw new Error('Choose a non-empty audio file in a supported format.')
  }

  const db = await getSqliteDb()
  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const downloadedAt = Date.now()
  const fileName = file.name
  const title = fileName.replace(/\.[^.]+$/, '')
  const track: DownloadedTrack = {
    id,
    title,
    channel: 'Local audio',
    thumb: '/icons/icon-192x192.png',
    downloaded_at: downloadedAt,
    sourceType: 'local',
    fileName,
    mimeType,
    fileSize: file.size
  }

  const audioData = await readAudioFile(file, onProgress)
  try {
    db.run(
      `INSERT INTO downloads
        (id, title, channel, thumb, downloaded_at, source_type, file_name, mime_type, file_size_bytes, audio_data)
       VALUES (?, ?, ?, ?, ?, 'local', ?, ?, ?, ?);`,
      [id, title, track.channel, track.thumb, downloadedAt, fileName, mimeType, file.size, audioData]
    )
    await persistDatabase()
    onProgress?.(100, 'complete')
  } catch (error) {
    db.run('DELETE FROM downloads WHERE id = ?;', [id])
    try {
      await persistDatabase()
    } catch (rollbackError) {
      console.error('[SQLite] Could not roll back failed MP3 import:', rollbackError)
    }
    throw error
  }
  return track
}

export async function removeDownloadFromSqlite(trackId: string): Promise<boolean> {
  const db = await getSqliteDb()
  const stmt = db.prepare('SELECT source_type FROM downloads WHERE id = ? LIMIT 1;')
  stmt.bind([trackId])
  const hasLocalAudio = stmt.step() && stmt.getAsObject().source_type === 'local'
  stmt.free()
  if (hasLocalAudio) await removeAudioFile(trackId)
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
  await clearAudioFiles()
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

  ensureDownloadsSchema(newDb)

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
