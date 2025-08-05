import dotenv from 'dotenv'
import { BskyAgent } from '@atproto/api'

dotenv.config()

const run = async () => {
  // Validate environment
  if (!process.env.BLUESKY_DID) {
    throw new Error('Please provide your BLUESKY_DID in your .env file')
  }
  
  if (!process.env.BLUESKY_HANDLE) {
    throw new Error('Please provide your BLUESKY_HANDLE in your .env file')
  }
  
  if (!process.env.BLUESKY_PASSWORD) {
    throw new Error('Please provide your BLUESKY_PASSWORD in your .env file')
  }

  // Auto-detect Railway domain or use localhost
  const hostname = 
    process.env.FEEDGEN_HOSTNAME ||
    process.env.RAILWAY_PUBLIC_DOMAIN ||
    process.env.RAILWAY_STATIC_URL?.replace('https://', '') ||
    'localhost'
  
  const serviceDid = `did:web:${hostname}`

  // Initialize AT Protocol agent
  const agent = new BskyAgent({ service: 'https://bsky.social' })
  
  // Login to Bluesky
  await agent.login({
    identifier: process.env.BLUESKY_HANDLE!,
    password: process.env.BLUESKY_PASSWORD!,
  })

  console.log(`✅ Logged in to Bluesky`)
  console.log(`🌐 Service DID: ${serviceDid}`)
  console.log(`🏠 Hostname: ${hostname}`)

  // Define the feed generator record
  const feedGenRecord = {
    did: serviceDid,
    displayName: 'Self Quotes',
    description: 'A feed of posts where people quote themselves - linking to their own profiles or posts',
    avatar: undefined, // You can upload an avatar blob here if you want
    createdAt: new Date().toISOString(),
  }

  console.log(`📝 Publishing feed with service DID: ${serviceDid}`)
  console.log(`🎯 Feed will be available at: at://${agent.session?.did}/app.bsky.feed.generator/self-quotes`)
  console.log(`🌐 Service endpoint: https://${hostname}`)

  // Publish the feed generator
  try {
    await agent.com.atproto.repo.putRecord({
      repo: agent.session?.did ?? '',
      collection: 'app.bsky.feed.generator',
      rkey: 'self-quotes',
      record: feedGenRecord,
    })

    console.log('🎉 Successfully published Self Quote feed generator!')
    console.log(`Feed URI: at://${agent.session?.did}/app.bsky.feed.generator/self-quotes`)
    console.log('')
    console.log('Your feed should now be discoverable on Bluesky!')
    console.log(`Share this URL: https://bsky.app/profile/${agent.session?.did}/feed/self-quotes`)
  } catch (err) {
    console.error('❌ Failed to publish feed generator:', err)
  }
}

run().catch(console.error)