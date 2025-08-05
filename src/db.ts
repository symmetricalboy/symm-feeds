export type Post = {
  uri: string
  cid: string
  authorDid: string
  authorHandle: string
  text: string
  selfQuoteType: 'profile' | 'post'
  matchedUrl: string
  indexedAt: string
}

export type SubState = {
  service: string
  cursor: number
}

export class InMemoryDatabase {
  private posts: Map<string, Post> = new Map()
  private subStates: Map<string, SubState> = new Map()

  // Post operations
  insertPost(post: Post): void {
    this.posts.set(post.uri, post)
  }

  getAllPosts(limit: number = 50): Post[] {
    const posts = Array.from(this.posts.values())
    return posts
      .sort((a, b) => new Date(b.indexedAt).getTime() - new Date(a.indexedAt).getTime())
      .slice(0, limit)
  }

  getPostsByAuthor(authorDid: string): Post[] {
    return Array.from(this.posts.values())
      .filter(post => post.authorDid === authorDid)
      .sort((a, b) => new Date(b.indexedAt).getTime() - new Date(a.indexedAt).getTime())
  }

  // Sub state operations
  getSubState(service: string): SubState | undefined {
    return this.subStates.get(service)
  }

  updateSubState(service: string, cursor: number): void {
    this.subStates.set(service, { service, cursor })
  }

  // Stats
  getPostCount(): number {
    return this.posts.size
  }

  getUniqueAuthors(): number {
    const authors = new Set(Array.from(this.posts.values()).map(p => p.authorDid))
    return authors.size
  }
}

export const createDb = (): InMemoryDatabase => {
  return new InMemoryDatabase()
}

export const migrateToLatest = (db: InMemoryDatabase) => {
  // No migration needed for in-memory database
  console.log('📊 Database initialized (in-memory)')
}