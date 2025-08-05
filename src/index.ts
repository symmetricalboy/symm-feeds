import { FeedGenerator } from './server'
import { cfg } from './config'

const run = async () => {
  console.log('🚀 Starting Self Quote Feed Generator...')
  console.log(`Configuration:`)
  console.log(`- Port: ${cfg.port}`)
  console.log(`- Hostname: ${cfg.hostname}`)
  console.log(`- Service DID: ${cfg.serviceDid}`)
  console.log(`- Publisher DID: ${cfg.publisherDid}`)
  
  const server = FeedGenerator.create(cfg)
  await server.start()
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...')
    process.exit(0)
  })
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down gracefully...')
    process.exit(0)
  })
}

run().catch((err) => {
  console.error('❌ Failed to start server:', err)
  process.exit(1)
})