import { AtUri } from '@atproto/syntax'
import { InMemoryDatabase } from '../db'
import { handler as selfQuotesHandler, selfQuotesUri } from './self-quotes'

type AlgoHandler = (db: InMemoryDatabase, limit: number, cursor?: string) => Promise<any> | any

const algos: Record<string, AlgoHandler> = {
  [selfQuotesUri.toString()]: selfQuotesHandler,
}

export default algos