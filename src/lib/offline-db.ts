export interface OfflineMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  type: 'text' | 'image' | 'audio'
  status: 'pending' | 'sent'
  created_at: string
}

export interface EventMessage {
  id: string
  event_id: string
  sender_id: string
  sender_name: string
  content: string
  created_at: string
}

class OfflineDB {
  private dbName = 'turnup_offline_db'
  private version = 2
  private db: IDBDatabase | null = null

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('event_messages')) {
          db.createObjectStore('event_messages', { keyPath: 'id' })
        }
      }
      request.onsuccess = (e: any) => {
        this.db = e.target.result
        resolve(this.db!)
      }
      request.onerror = (e) => reject(e)
    })
  }

  async saveMessage(msg: OfflineMessage): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('messages', 'readwrite')
      const store = tx.objectStore('messages')
      const req = store.put(msg)
      req.onsuccess = () => resolve()
      req.onerror = (e) => reject(e)
    })
  }

  async getPendingMessages(): Promise<OfflineMessage[]> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('messages', 'readonly')
      const store = tx.objectStore('messages')
      const req = store.getAll()
      req.onsuccess = () => {
        const msgs: OfflineMessage[] = req.result || []
        resolve(msgs.filter(m => m.status === 'pending'))
      }
      req.onerror = (e) => reject(e)
    })
  }

  async markAsSent(id: string): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('messages', 'readwrite')
      const store = tx.objectStore('messages')
      const getReq = store.get(id)
      getReq.onsuccess = () => {
        const msg = getReq.result
        if (msg) {
          msg.status = 'sent'
          const putReq = store.put(msg)
          putReq.onsuccess = () => resolve()
          putReq.onerror = (e) => reject(e)
        } else {
          resolve()
        }
      }
      getReq.onerror = (e) => reject(e)
    })
  }

  async clearSentMessages(): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('messages', 'readwrite')
      const store = tx.objectStore('messages')
      const req = store.getAll()
      req.onsuccess = () => {
        const msgs: OfflineMessage[] = req.result || []
        const tx2 = db.transaction('messages', 'readwrite')
        const store2 = tx2.objectStore('messages')
        msgs.forEach(m => {
          if (m.status === 'sent') {
            store2.delete(m.id)
          }
        })
        resolve()
      }
      req.onerror = (e) => reject(e)
    })
  }

  async saveEventMessage(msg: EventMessage): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('event_messages', 'readwrite')
      const store = tx.objectStore('event_messages')
      const req = store.put(msg)
      req.onsuccess = () => resolve()
      req.onerror = (e) => reject(e)
    })
  }

  async getEventMessages(eventId: string): Promise<EventMessage[]> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('event_messages', 'readonly')
      const store = tx.objectStore('event_messages')
      const req = store.getAll()
      req.onsuccess = () => {
        const msgs: EventMessage[] = req.result || []
        resolve(msgs.filter(m => m.event_id === eventId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
      }
      req.onerror = (e) => reject(e)
    })
  }
}

export const offlineDB = new OfflineDB()
