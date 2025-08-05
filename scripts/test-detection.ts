import { detectSelfQuote } from '../src/algos/self-quotes'

// Test cases for self-quote detection
const testCases = [
  {
    name: "Profile self-quote",
    authorDid: "did:plc:test123",
    authorHandle: "alice.bsky.social", 
    text: "Check out my profile! https://bsky.app/profile/alice.bsky.social"
  },
  {
    name: "Post self-quote",
    authorDid: "did:plc:test456",
    authorHandle: "bob.bsky.social",
    text: "Here's my latest post: https://bsky.app/profile/bob.bsky.social/post/xyz789"
  },
  {
    name: "DID-based self-quote",
    authorDid: "did:plc:test789",
    authorHandle: "charlie.bsky.social",
    text: "Follow me at https://bsky.app/profile/did:plc:test789 for more updates!"
  },
  {
    name: "Not a self-quote",
    authorDid: "did:plc:test123",
    authorHandle: "alice.bsky.social",
    text: "Check out this other user: https://bsky.app/profile/someone-else.bsky.social"
  },
  {
    name: "Handle without @",
    authorDid: "did:plc:test999",
    authorHandle: "test.bsky.social",
    text: "My profile: https://bsky.app/profile/test for updates"
  }
]

console.log('🧪 Testing self-quote detection logic...\n')

for (const testCase of testCases) {
  console.log(`📝 Test: ${testCase.name}`)
  console.log(`   Author: ${testCase.authorHandle} (${testCase.authorDid})`)
  console.log(`   Text: "${testCase.text}"`)
  
  const result = detectSelfQuote(testCase.authorDid, testCase.authorHandle, testCase.text)
  
  if (result.isSelfQuote) {
    console.log(`   ✅ DETECTED as ${result.type}: ${result.matchedUrl}`)
  } else {
    console.log(`   ❌ Not detected as self-quote`)
  }
  console.log('')
}

console.log('🎯 Testing with real-world examples...')

// Test some realistic examples
const realExamples = [
  "Check out my profile https://bsky.app/profile/myhandle.bsky.social",
  "My latest thoughts: https://bsky.app/profile/myhandle.bsky.social/post/abc123",
  "Follow me at bsky.app/profile/myhandle.bsky.social!",
  "Here's my post https://staging.bsky.app/profile/myhandle.bsky.social/post/xyz"
]

for (const text of realExamples) {
  const result = detectSelfQuote("did:plc:example", "myhandle.bsky.social", text)
  console.log(`"${text.substring(0, 50)}..." -> ${result.isSelfQuote ? '✅ MATCH' : '❌ NO MATCH'}`)
}