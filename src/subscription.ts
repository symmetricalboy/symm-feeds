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
    let authorHandle = event.identity?.handle || authorDid
    
    // Ensure handle has proper format
    if (!authorHandle.includes('.')) {
      authorHandle = `${authorHandle}.bsky.social`
    }

    // Log every 100th post we examine
    if (!this.postCount) this.postCount = 0
    this.postCount++
    
    if (this.postCount % 100 === 0) {
      console.log(`🔍 Examined ${this.postCount} posts so far...`)
    }

    // Check if this post contains self-quotes
    const detection = detectSelfQuote(authorDid, authorHandle, postText)
    
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
}