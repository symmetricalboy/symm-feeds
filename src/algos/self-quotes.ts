import { AtUri } from '@atproto/syntax'
import { InMemoryDatabase, Post } from '../db'

import { cfg } from '../config'

export const selfQuotesUri = AtUri.make(
  cfg.serviceDid,
  'app.bsky.feed.generator',
  'self-quotes'
)

/**
 * Detects if a post contains self-quotes (links to the author's own profile or posts)
 */
export function detectSelfQuote(
  authorDid: string,
  authorHandle: string,
  text: string
): { isSelfQuote: boolean; type?: 'profile' | 'post'; matchedUrl?: string } {
  // Normalize the author handle for comparison
  const normalizedHandle = authorHandle.replace(/^@/, '').toLowerCase()
  const normalizedDid = authorDid.toLowerCase()
  
  // More comprehensive regex patterns to match Bluesky URLs
  const postUrlPattern = /https?:\/\/(?:bsky\.app|staging\.bsky\.app)\/profile\/([a-zA-Z0-9:._-]+)\/post\/([a-zA-Z0-9]+)/g
  const profileUrlPattern = /https?:\/\/(?:bsky\.app|staging\.bsky\.app)\/profile\/([a-zA-Z0-9:._-]+)(?!\/post)/g
  
  // Check for post links first (more specific)
  const postMatches = Array.from(text.matchAll(postUrlPattern))
  for (const match of postMatches) {
    const handleOrDidFromUrl = match[1].toLowerCase()
    
    // Check if the linked profile matches the author
    if (isMatchingIdentity(handleOrDidFromUrl, normalizedDid, normalizedHandle)) {
      return {
        isSelfQuote: true,
        type: 'post',
        matchedUrl: match[0]
      }
    }
  }
  
  // Check for profile links (less specific)
  const profileMatches = Array.from(text.matchAll(profileUrlPattern))
  for (const match of profileMatches) {
    const handleOrDidFromUrl = match[1].toLowerCase()
    
    // Check if the linked profile matches the author
    if (isMatchingIdentity(handleOrDidFromUrl, normalizedDid, normalizedHandle)) {
      return {
        isSelfQuote: true,
        type: 'profile',
        matchedUrl: match[0]
      }
    }
  }
  
  return { isSelfQuote: false }
}

/**
 * Helper function to check if a URL identifier matches the author's identity
 */
function isMatchingIdentity(urlIdentifier: string, authorDid: string, authorHandle: string): boolean {
  // Direct DID match
  if (urlIdentifier === authorDid) {
    return true
  }
  
  // Direct handle match
  if (urlIdentifier === authorHandle) {
    return true
  }
  
  // Handle without .bsky.social suffix
  if (urlIdentifier === authorHandle.replace('.bsky.social', '')) {
    return true
  }
  
  // Handle with .bsky.social added if URL identifier doesn't have a domain
  if (!urlIdentifier.includes('.') && urlIdentifier === authorHandle.replace('.bsky.social', '')) {
    return true
  }
  
  // Handle case where URL has .bsky.social but stored handle doesn't
  if (urlIdentifier.endsWith('.bsky.social') && urlIdentifier === `${authorHandle.replace('.bsky.social', '')}.bsky.social`) {
    return true
  }
  
  return false
}



/**
 * Generate the feed of self-quotes
 */
export function handler(db: InMemoryDatabase, limit: number, cursor?: string) {
  // Get all posts and filter for self-quotes
  const allPosts: Post[] = db.getAllPosts(1000) // Get more posts to filter from
  
  // Filter for actual self-quotes using our detection logic
  const selfQuotePosts = allPosts.filter(post => {
    const detection = detectSelfQuote(post.authorDid, post.authorHandle, post.text)
    return detection.isSelfQuote
  })
  
  // Apply cursor-based pagination if provided
  let filteredPosts = selfQuotePosts
  if (cursor) {
    filteredPosts = selfQuotePosts.filter(post => post.indexedAt < cursor)
  }
  
  // Limit the results
  const posts = filteredPosts.slice(0, limit)
  
  let nextCursor: string | undefined
  const last = posts.at(-1)
  if (last) {
    nextCursor = last.indexedAt
  }

  return {
    cursor: nextCursor,
    feed: posts.map((row) => ({
      post: row.uri,
    })),
  }
}