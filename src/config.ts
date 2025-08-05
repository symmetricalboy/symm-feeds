import dotenv from 'dotenv'

dotenv.config()

const maybeStr = (val?: string) => {
  if (!val) return undefined
  return val
}

const maybeInt = (val?: string) => {
  if (!val) return undefined
  const int = parseInt(val, 10)
  if (isNaN(int)) return undefined
  return int
}

export type Config = {
  port: number
  hostname: string
  serviceDid: string
  publisherDid: string
  blueskyHandle?: string
  blueskyPassword?: string
}

export const envToCfg = (env: Record<string, string | undefined>): Config => {
  // Railway automatically sets these
  const port = maybeInt(env.PORT) ?? 3000
  const hostname = 
    maybeStr(env.RAILWAY_PUBLIC_DOMAIN) ??
    maybeStr(env.RAILWAY_STATIC_URL)?.replace('https://', '') ??
    'localhost'
  
  const serviceDid = `did:web:${hostname}`

  return {
    port,
    hostname,
    serviceDid,
    publisherDid: maybeStr(env.BLUESKY_DID) ?? serviceDid,
    blueskyHandle: maybeStr(env.BLUESKY_HANDLE),
    blueskyPassword: maybeStr(env.BLUESKY_PASSWORD),
  }
}

export const cfg = envToCfg(process.env)