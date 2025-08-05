import http from 'http'
import events from 'events'
import express from 'express'
import cors from 'cors'
import compression from 'compression'
import helmet from 'helmet'
import algos from './algos'
import { createDb, migrateToLatest, InMemoryDatabase } from './db'
import { FirehoseSubscription } from './subscription'
import { Config } from './config'

export class FeedGenerator {
  public app: express.Application
  public server?: http.Server
  public db: InMemoryDatabase
  public firehose: FirehoseSubscription
  public cfg: Config

  constructor(
    app: express.Application,
    db: InMemoryDatabase,
    firehose: FirehoseSubscription,
    cfg: Config,
  ) {
    this.app = app
    this.db = db
    this.firehose = firehose
    this.cfg = cfg
  }

  static create(cfg: Config) {
    const app = express()
    
    // Security and optimization middleware
    app.use(helmet())
    app.use(cors())
    app.use(compression())
    app.use(express.json({ limit: '100kb' }))

    const db = createDb()
    migrateToLatest(db)

    const firehose = new FirehoseSubscription(db)

    const generator = new FeedGenerator(app, db, firehose, cfg)
    generator.setupRoutes()

    return generator
  }

  setupRoutes() {
    // Health check
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Self Quote Feed Generator',
        description: 'A feed of posts where people quote themselves',
        status: 'active',
        hostname: this.cfg.hostname,
        serviceDid: this.cfg.serviceDid,
        stats: {
          totalPosts: this.db.getPostCount(),
          uniqueAuthors: this.db.getUniqueAuthors()
        },
        feeds: [
          {
            uri: `at://${this.cfg.serviceDid}/app.bsky.feed.generator/self-quotes`,
            displayName: 'Self Quotes',
            description: 'Posts where people link to their own profiles or posts'
          }
        ]
      })
    })

    // AT Protocol endpoints
    this.app.get('/xrpc/app.bsky.feed.getFeedSkeleton', async (req, res) => {
      try {
        const feedUri = req.query.feed as string
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
        const cursor = req.query.cursor as string

        const algo = algos[feedUri]
        if (!algo) {
          return res.status(400).json({ error: `Unsupported algorithm: ${feedUri}` })
        }

        const result = await algo(this.db, limit, cursor)
        res.json(result)
      } catch (error) {
        console.error('Feed skeleton error:', error)
        res.status(500).json({ error: 'Internal server error' })
      }
    })

    this.app.get('/xrpc/app.bsky.feed.describeFeedGenerator', (req, res) => {
      const feeds = [
        {
          uri: `at://${this.cfg.serviceDid}/app.bsky.feed.generator/self-quotes`,
          displayName: 'Self Quotes',
          description: 'Posts where people link to their own profiles or posts',
        },
      ]
      
      res.json({
        did: this.cfg.serviceDid,
        feeds,
      })
    })

    // Well-known DID document
    this.app.get('/.well-known/did.json', (req, res) => {
      res.json({
        '@context': ['https://www.w3.org/ns/did/v1'],
        id: this.cfg.serviceDid,
        service: [
          {
            id: '#bsky_fg',
            type: 'BskyFeedGenerator',
            serviceEndpoint: `https://${this.cfg.hostname}`,
          },
        ],
      })
    })
  }

  async start(): Promise<http.Server> {
    await this.firehose.run(3000) // 3 second reconnect delay
    this.server = this.app.listen(this.cfg.port, () => {
      console.log(
        `🤖 Self Quote Feed Generator is running at http://${this.cfg.hostname}:${this.cfg.port}`,
      )
    })
    await events.once(this.server, 'listening')
    return this.server
  }
}