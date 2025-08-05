import { BskyAgent } from '@atproto/api'
import WebSocket from 'ws'
import { InMemoryDatabase } from './db'
import { detectSelfQuote } from './algos/self-quotes'

interface JetstreamEvent {
  did: string
  time_us: number
  kind: string
  commit?: {
    rev: string
    operation: string
    collection: string
    rkey: string
    record?: {
      text?: string
      createdAt: string
      [key: string]: any
    }
  }
  identity?: {
    did: string
    handle: string
    displayName?: string
    [key: string]: any
  }
}

export class FirehoseSubscription {
  public db: InMemoryDatabase
  public agent: BskyAgent
  private ws?: WebSocket
  private reconnectDelay: number = 5000
  private isRunning: boolean = false
  private eventCount: number = 0
  private postCount: number = 0
  private debugUrlCount: number = 0
  private skippedCount: number = 0
  private resolvedCount: number = 0
  private didCache: Map<string, string | null> = new Map()

  constructor(db: InMemoryDatabase) {
    this.db = db
    this.agent = new BskyAgent({ service: 'https://bsky.social' })
  }

  async run(subscriptionReconnectDelay: number = 5000) {
    this.reconnectDelay = subscriptionReconnectDelay
    this.isRunning = true
    
    console.log('🔥 Starting Jetstream firehose subscription...')
    await this.connect()
    
    // Status logging
    setInterval(() => {
      const postCount = this.db.getPostCount()
      const uniqueAuthors = this.db.getUniqueAuthors()
      console.log(`📊 Feed status - ${postCount} self-quote posts from ${uniqueAuthors} unique authors`)
      console.log(`📈 Processing stats - Examined: ${this.postCount || 0}, Skipped: ${this.skippedCount || 0}, Resolved: ${this.resolvedCount || 0}, Total events: ${this.eventCount || 0}`)
      
      // Calculate success rates
      const totalProcessed = (this.postCount || 0) + (this.skippedCount || 0)
      if (totalProcessed > 0) {
        const successRate = ((this.postCount || 0) / totalProcessed * 100).toFixed(1)
        console.log(`📈 Success rate: ${successRate}% posts processed successfully`)
      }
    }, 30000)
  }

  private async connect() {
    try {
      // Connect to Jetstream - a JSON-based AT Protocol firehose
      this.ws = new WebSocket('wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post')
      
      this.ws.on('open', () => {
        console.log('✅ Connected to Jetstream firehose')
      })

      this.ws.on('message', (data) => {
        try {
          const event: JetstreamEvent = JSON.parse(data.toString())
          this.handleEvent(event)
        } catch (error) {
          console.error('⚠️  Failed to parse Jetstream event:', error)
        }
      })

      this.ws.on('error', (error) => {
        console.error('❌ Jetstream WebSocket error:', error)
        this.reconnect()
      })

      this.ws.on('close', () => {
        console.log('📡 Jetstream connection closed')
        if (this.isRunning) {
          this.reconnect()
        }
      })

    } catch (error) {
      console.error('❌ Failed to connect to Jetstream:', error)
      this.reconnect()
    }
  }

  private reconnect() {
    if (!this.isRunning) return
    
    console.log(`🔄 Reconnecting to Jetstream in ${this.reconnectDelay}ms...`)
    setTimeout(() => {
      if (this.isRunning) {
        this.connect()
      }
    }, this.reconnectDelay)
  }

  private async handleEvent(event: JetstreamEvent) {
    // Debug: Log all events we receive (first 100)
    if (!this.eventCount) this.eventCount = 0
    this.eventCount++
    
    if (this.eventCount <= 100) {
      console.log(`📨 Event ${this.eventCount}: ${event.kind} - ${event.commit?.collection || 'no collection'}`)
    } else if (this.eventCount === 101) {
      console.log('📨 Stopping event logging after 100 events (firehose is active)')
    }

    // Only process post creation events
    if (event.kind !== 'commit' || 
        event.commit?.operation !== 'create' || 
        event.commit?.collection !== 'app.bsky.feed.post' ||
        !event.commit?.record?.text) {
      return
    }

    const post = event.commit.record
    const authorDid = event.did
    const postText = post.text
    
    // Ensure we have the required text content
    if (!postText || typeof postText !== 'string') {
      return
    }
    
    // Get author handle from identity if available
    let authorHandle = event.identity?.handle
    
    // If we have a handle from the event, use it (this is the most reliable)
    if (authorHandle && !authorHandle.startsWith('did:plc:')) {
      // Ensure handle has proper format
      if (!authorHandle.includes('.')) {
        authorHandle = `${authorHandle}.bsky.social`
      }
    } else {
      // Try to resolve DID to handle only if we don't have a valid handle
      const resolvedHandle = await this.resolveDidToHandle(authorDid)
      
      if (resolvedHandle) {
        authorHandle = resolvedHandle
        if (!this.resolvedCount) this.resolvedCount = 0
        this.resolvedCount++
        
        if (this.resolvedCount <= 5) {
          console.log(`🔍 Resolved DID ${this.resolvedCount}: ${authorDid} → ${authorHandle}`)
        } else if (this.resolvedCount === 6) {
          console.log(`🔍 DID resolution working (will log stats periodically)`)
        }
      } else {
        // If we can't resolve DID to handle, skip this post for now
        // but don't skip posts that might have handles in other ways
        if (!this.skippedCount) this.skippedCount = 0
        this.skippedCount++
        
        if (this.skippedCount <= 3) {
          console.log(`⏭️  Skipped post ${this.skippedCount}: Could not resolve DID to handle (${authorDid})`)
        } else if (this.skippedCount === 4) {
          console.log(`⏭️  Skipping posts where DID resolution fails (will log stats periodically)`)
        }
        
        return
      }
    }

    // Log every 100th post we examine
    if (!this.postCount) this.postCount = 0
    this.postCount++
    
    if (this.postCount % 100 === 0) {
      console.log(`🔍 Examined ${this.postCount} posts so far...`)
    }

    // Debug: Log some sample posts to understand real-world formats
    if (this.postCount <= 5) {
      console.log(`📝 Sample post ${this.postCount}:`)
      console.log(`   Author: ${authorHandle} (${authorDid})`)
      console.log(`   Text: "${postText.substring(0, 200)}${postText.length > 200 ? '...' : ''}"`)
    }

    // Check if this post contains self-quotes
    const detection = detectSelfQuote(authorDid, authorHandle, postText)
    
    // Debug: Log posts that contain bsky.app URLs (potential self-quotes)
    if (postText.includes('bsky.app/profile/') && this.debugUrlCount < 10) {
      if (!this.debugUrlCount) this.debugUrlCount = 0
      this.debugUrlCount++
      console.log(`🔗 URL post ${this.debugUrlCount}:`)
      console.log(`   Author: ${authorHandle} (${authorDid})`)
      console.log(`   Text: "${postText}"`)
      console.log(`   Detection result: ${detection.isSelfQuote ? `✅ MATCH (${detection.type})` : '❌ No match'}`)
    }
      
    if (detection.isSelfQuote) {
      const postUri = `at://${authorDid}/app.bsky.feed.post/${event.commit.rkey}`
      
      // Store the self-quote post
      this.db.insertPost({
        uri: postUri,
        cid: event.commit.rev,
        authorDid: authorDid,
        authorHandle: authorHandle,
        text: postText,
        selfQuoteType: detection.type!,
        matchedUrl: detection.matchedUrl!,
        indexedAt: post.createdAt || new Date().toISOString()
      })
      
      console.log(`🎯 Found self-quote: @${authorHandle} -> ${detection.type} (${detection.matchedUrl})`)
    }
  }

  public stop() {
    this.isRunning = false
    if (this.ws) {
      this.ws.close()
    }
    console.log('🛑 Jetstream subscription stopped')
  }

  /**
   * Resolve a DID to a handle using multiple methods
   * Returns null if resolution fails
   */
  private async resolveDidToHandle(did: string): Promise<string | null> {
    // Check cache first
    if (this.didCache.has(did)) {
      return this.didCache.get(did)!
    }

    try {
      // Method 1: Try PLC directory first
      const plcResponse = await fetch(`https://web.plc.directory/${did}`, {
        headers: { 'User-Agent': 'SelfQuoteFeedGenerator/1.0' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      if (plcResponse.ok) {
        const didDocument = await plcResponse.json() as any
        
        // Extract handle from alsoKnownAs field
        const alsoKnownAs = didDocument.alsoKnownAs
        if (Array.isArray(alsoKnownAs)) {
          for (const alias of alsoKnownAs) {
            if (typeof alias === 'string' && alias.startsWith('at://')) {
              const handle = alias.replace('at://', '')
              // Cache and return the resolved handle
              this.didCache.set(did, handle)
              return handle
            }
          }
        }
      }

      // Method 2: Try AT Protocol identity resolution
      try {
        const atProtoResponse = await fetch(`https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${did}`, {
          headers: { 'User-Agent': 'SelfQuoteFeedGenerator/1.0' },
          signal: AbortSignal.timeout(3000) // 3 second timeout
        })
        
        if (atProtoResponse.ok) {
          const data = await atProtoResponse.json() as any
          if (data.handle) {
            // Cache and return the resolved handle
            this.didCache.set(did, data.handle)
            return data.handle
          }
        }
      } catch (atProtoError) {
        // Continue to failure case
      }

      // Cache failure to avoid repeated requests for 5 minutes
      this.didCache.set(did, null)
      setTimeout(() => {
        this.didCache.delete(did)
      }, 5 * 60 * 1000)
      
      return null
      
    } catch (error) {
      // Only log errors occasionally to avoid spam
      if (Math.random() < 0.01) { // 1% chance
        console.error(`❌ Failed to resolve DID ${did}:`, error)
      }
      
      // Cache failure briefly
      this.didCache.set(did, null)
      setTimeout(() => {
        this.didCache.delete(did)
      }, 30 * 1000) // 30 seconds for errors
      
      return null
    }
  }
}