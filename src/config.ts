import dotenv from 'dotenv'

dotenv.config()

export interface Config {
  port: number
  hostname: string
  serviceDid: string
  publisherDid: string
  subscriptionEndpoint: string
}

export const cfg: Config = {
  port: parseInt(process.env.PORT || process.env.FEEDGEN_PORT || '3000', 10),
  hostname: process.env.FEEDGEN_HOSTNAME || 'localhost',
  serviceDid:
    process.env.FEEDGEN_SERVICE_DID || 'did:web:self-quote-feed.fly.dev',
  publisherDid:
    process.env.FEEDGEN_PUBLISHER_DID || 'did:plc:4y4wmofpqlwz7e5q5nzjpzdd',
  subscriptionEndpoint:
    process.env.FEEDGEN_SUBSCRIPTION_ENDPOINT || 'wss://bsky.network',
}

export default cfg
