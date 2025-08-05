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
  // Regex patterns to match Bluesky URLs
  const profileUrlPattern = /https?:\/\/(?:bsky\.app|staging\.bsky\.app)\/profile\/([a-zA-Z0-9:._-]+)/g
  const postUrlPattern = /https?:\/\/(?:bsky\.app|staging\.bsky\.app)\/profile\/([a-zA-Z0-9:._-]+)\/post\/[a-zA-Z0-9]+/g
  
  // Check for profile links first (more specific)
  const postMatches = Array.from(text.matchAll(postUrlPattern))
  for (const match of postMatches) {
    const handleOrDidFromUrl = match[1]
    
    // Check if the linked profile matches the author
    if (handleOrDidFromUrl === authorDid || 
        handleOrDidFromUrl === authorHandle ||
        handleOrDidFromUrl === authorHandle.replace('@', '')) {
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
    const handleOrDidFromUrl = match[1]
    
    // Check if the linked profile matches the author
    if (handleOrDidFromUrl === authorDid || 
        handleOrDidFromUrl === authorHandle ||
        handleOrDidFromUrl === authorHandle.replace('@', '')) {
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