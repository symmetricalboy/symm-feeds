import { BskyAgent } from '@atproto/api'
import { InMemoryDatabase } from './db'
import { detectSelfQuote } from './algos/self-quotes'

export class FirehoseSubscription {
  public db: InMemoryDatabase
  public agent: BskyAgent

  constructor(db: InMemoryDatabase) {
    this.db = db
    this.agent = new BskyAgent({ service: 'https://bsky.social' })
  }

  async run(subscriptionReconnectDelay: number) {
    console.log('🔥 Starting firehose subscription...')
    
    // TODO: Implement real firehose connection
    // For now, using empty database (better than fake data)
    console.log('⚠️  Using empty database - implement real firehose to populate with actual posts')
    
    // Keep the process running
    setInterval(() => {
      const postCount = this.db.getPostCount()
      console.log(`📊 Feed generator active - ${postCount} posts in database`)
    }, 30000)
  }

  private createSampleData() {
    console.log('📝 Creating sample self-quote posts...')
    
    const samplePosts = [
      {
        uri: 'at://did:plc:sample1/app.bsky.feed.post/abc123',
        cid: 'sample-cid-1',
        authorDid: 'did:plc:sample1',
        authorHandle: 'alice.bsky.social',
        text: 'Check out my profile! https://bsky.app/profile/alice.bsky.social',
        indexedAt: new Date().toISOString()
      },
      {
        uri: 'at://did:plc:sample2/app.bsky.feed.post/def456',
        cid: 'sample-cid-2',
        authorDid: 'did:plc:sample2',
        authorHandle: 'bob.bsky.social',
        text: 'Here\'s my latest post: https://bsky.app/profile/bob.bsky.social/post/xyz789',
        indexedAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      },
      {
        uri: 'at://did:plc:sample3/app.bsky.feed.post/ghi789',
        cid: 'sample-cid-3',
        authorDid: 'did:plc:sample3',
        authorHandle: 'charlie.bsky.social',
        text: 'Follow me at https://bsky.app/profile/charlie.bsky.social for more updates!',
        indexedAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
      }
    ]

    for (const post of samplePosts) {
      const detection = detectSelfQuote(post.authorDid, post.authorHandle, post.text)
      
      if (detection.isSelfQuote) {
        this.db.insertPost({
          uri: post.uri,
          cid: post.cid,
          authorDid: post.authorDid,
          authorHandle: post.authorHandle,
          text: post.text,
          selfQuoteType: detection.type!,
          matchedUrl: detection.matchedUrl!,
          indexedAt: post.indexedAt
        })
        
        console.log(`✅ Stored self-quote: ${post.authorHandle} -> ${detection.type}`)
      }
    }
  }
}