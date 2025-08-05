import fetch from 'node-fetch'

const testAPI = async () => {
  const baseUrl = 'http://localhost:3000'
  
  console.log('🧪 Testing Self Quote Feed Generator API')
  console.log('=====================================\n')

  try {
    // Test health endpoint
    console.log('📊 Testing health endpoint...')
    const healthResponse = await fetch(`${baseUrl}/`)
    const healthData = await healthResponse.json()
    
    if (healthResponse.ok) {
      console.log('✅ Health check passed')
      console.log(`   - Status: ${healthData.status}`)
      console.log(`   - Service DID: ${healthData.serviceDid}`)
      console.log(`   - Total Posts: ${healthData.stats.totalPosts}`)
      console.log(`   - Unique Authors: ${healthData.stats.uniqueAuthors}`)
    } else {
      console.log('❌ Health check failed')
      return
    }

    // Test feed descriptor
    console.log('\n📋 Testing feed descriptor...')
    const descriptorResponse = await fetch(`${baseUrl}/xrpc/app.bsky.feed.describeFeedGenerator`)
    const descriptorData = await descriptorResponse.json()
    
    if (descriptorResponse.ok) {
      console.log('✅ Feed descriptor working')
      console.log(`   - Feeds available: ${descriptorData.feeds.length}`)
      console.log(`   - Feed name: ${descriptorData.feeds[0].displayName}`)
    } else {
      console.log('❌ Feed descriptor failed')
    }

    // Test feed skeleton
    console.log('\n🦴 Testing feed skeleton...')
    const feedUri = descriptorData.feeds[0].uri
    const skeletonResponse = await fetch(`${baseUrl}/xrpc/app.bsky.feed.getFeedSkeleton?feed=${encodeURIComponent(feedUri)}&limit=10`)
    const skeletonData = await skeletonResponse.json()
    
    if (skeletonResponse.ok) {
      console.log('✅ Feed skeleton working')
      console.log(`   - Posts in feed: ${skeletonData.feed.length}`)
      if (skeletonData.feed.length > 0) {
        console.log(`   - Sample post: ${skeletonData.feed[0].post}`)
      }
    } else {
      console.log('❌ Feed skeleton failed')
      console.log(`   - Error: ${skeletonData.error}`)
    }

    // Test DID document
    console.log('\n🆔 Testing DID document...')
    const didResponse = await fetch(`${baseUrl}/.well-known/did.json`)
    const didData = await didResponse.json()
    
    if (didResponse.ok) {
      console.log('✅ DID document working')
      console.log(`   - DID: ${didData.id}`)
      console.log(`   - Service endpoint: ${didData.service[0].serviceEndpoint}`)
    } else {
      console.log('❌ DID document failed')
    }

    console.log('\n🎉 All API tests completed!')
    
  } catch (error) {
    console.error('❌ API test failed:', error)
    console.log('\n💡 Make sure the server is running with: npm run dev')
  }
}

testAPI()