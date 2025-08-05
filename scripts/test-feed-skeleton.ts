import fetch from 'node-fetch'

const testFeedSkeleton = async () => {
  const feedUri = 'at://did:web:feeds.symm.app/app.bsky.feed.generator/self-quotes'
  const url = `https://feeds.symm.app/xrpc/app.bsky.feed.getFeedSkeleton?feed=${encodeURIComponent(feedUri)}&limit=10`
  
  console.log('🧪 Testing feed skeleton endpoint...')
  console.log(`URL: ${url}`)
  
  try {
    const response = await fetch(url)
    console.log(`Status: ${response.status}`)
    console.log(`Headers:`, response.headers.raw())
    
    const responseText = await response.text()
    console.log(`Response:`, responseText)
    
    if (response.status >= 400) {
      console.log('❌ Feed skeleton endpoint failed!')
      try {
        const errorData = JSON.parse(responseText)
        console.log('Error details:', errorData)
      } catch (e) {
        console.log('Could not parse error as JSON')
      }
    } else {
      console.log('✅ Feed skeleton endpoint working')
    }
    
  } catch (error) {
    console.error('❌ Network error:', error)
  }
}

testFeedSkeleton()