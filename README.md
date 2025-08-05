# Self Quote Feed Generator for Bluesky

A custom feed generator that detects when people quote themselves on Bluesky - posts where users link to their own profiles or posts.

## 🎯 What This Does

This feed generator monitors the Bluesky firehose and identifies posts where:
- Users link to their own profile (`https://bsky.app/profile/their-handle`)
- Users link to their own posts (`https://bsky.app/profile/their-handle/post/xyz`)

Perfect for finding self-promotion, self-references, and interesting self-quoting behavior!

## 🚀 Quick Deploy to Railway

### Prerequisites

1. A [Railway](https://railway.app) account
2. A Bluesky account
3. Your Bluesky DID (we'll help you find this)

### Step 1: Find Your Bluesky DID

1. Go to `https://bsky.app/profile/YOUR-HANDLE`
2. View page source and search for `"did:plc:` 
3. Copy the full DID (starts with `did:plc:`)

Alternatively, use this API: `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=YOUR-HANDLE.bsky.social`

### Step 2: Deploy to Railway

1. **Fork this repository** to your GitHub account

2. **Connect to Railway:**
   - Go to [Railway](https://railway.app)
   - Click "Deploy from GitHub repo"
   - Select your forked repository
   - Railway will auto-detect the Dockerfile

3. **Set Environment Variables:**
   Click on your deployed service, go to "Variables" tab, and add:

   ```bash
   FEEDGEN_PORT=3000
   FEEDGEN_HOSTNAME=your-app-name.railway.app
   FEEDGEN_SUBSCRIPTION_ENDPOINT=wss://bsky.network
   FEEDGEN_SERVICE_DID=did:web:your-app-name.railway.app
   FEEDGEN_PUBLISHER_DID=your-bluesky-did-from-step-1
   BLUESKY_HANDLE=your-handle.bsky.social
   BLUESKY_PASSWORD=your-bluesky-app-password
   ```

   **Important:** 
   - Replace `your-app-name` with your actual Railway app name
   - Replace `your-bluesky-did-from-step-1` with the DID you found
   - For `BLUESKY_PASSWORD`, use an App Password (Settings → Privacy & Security → App Passwords)

4. **Deploy:**
   - Railway will automatically deploy
   - Wait for the build to complete
   - Your feed generator will be running at `https://your-app-name.railway.app`

### Step 3: Publish Your Feed to Bluesky

1. **SSH into your Railway deployment:**
   ```bash
   railway shell
   ```

2. **Publish the feed:**
   ```bash
   npm run publishFeed
   ```

3. **Verify it worked:**
   - You should see "Successfully published Self Quote feed generator!"
   - Your feed URI will be displayed

### Step 4: Test Your Feed

1. Go to `https://bsky.app/profile/YOUR-HANDLE/feed/self-quotes`
2. Your custom feed should be visible!
3. Share the URL with others so they can subscribe

## 🛠️ Local Development

### Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd self-quote-feed
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file** with your configuration

5. **Run in development mode:**
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run publishFeed` - Publish your feed to Bluesky

## 🔧 How It Works

1. **Firehose Listener:** Connects to Bluesky's real-time firehose
2. **Self-Quote Detection:** For each new post:
   - Extracts author's DID and handle
   - Scans post text for Bluesky URLs using regex
   - Compares linked profiles with post author
   - Stores matches in SQLite database
3. **Feed Generation:** Serves matched posts via AT Protocol feed interface

### Detection Logic

The algorithm uses these regex patterns:
- Profile links: `https?://(?:bsky\.app|staging\.bsky\.app)/profile/([a-zA-Z0-9:._-]+)`
- Post links: `https?://(?:bsky\.app|staging\.bsky\.app)/profile/([a-zA-Z0-9:._-]+)/post/[a-zA-Z0-9]+`

## 📊 Database Schema

```sql
CREATE TABLE post (
  uri TEXT PRIMARY KEY,           -- AT Protocol URI
  cid TEXT NOT NULL,             -- Content ID
  authorDid TEXT NOT NULL,       -- Author's DID
  authorHandle TEXT NOT NULL,    -- Author's handle
  text TEXT NOT NULL,            -- Post text
  selfQuoteType TEXT NOT NULL,   -- 'profile' or 'post'
  matchedUrl TEXT NOT NULL,      -- The self-quote URL found
  indexedAt TEXT NOT NULL        -- When we indexed it
);
```

## 🎛️ Configuration

Just **3 simple environment variables**:

| Environment Variable | Description | Example |
|---------------------|-------------|---------|
| `BLUESKY_DID` | Your Bluesky DID | `did:plc:abc123...` |
| `BLUESKY_HANDLE` | Your Bluesky handle | `alice.bsky.social` |
| `BLUESKY_PASSWORD` | Your app password | `abcd-efgh-ijkl-mnop` |

**Railway automatically provides**: `PORT`, `RAILWAY_PUBLIC_DOMAIN`

## 🐛 Troubleshooting

### Feed Not Showing Posts
- Check Railway logs: `railway logs`
- Ensure your service is connecting to the firehose
- Verify environment variables are correct

### "Failed to publish feed generator"
- Double-check your Bluesky handle and app password
- Ensure your `FEEDGEN_SERVICE_DID` matches your Railway domain
- Try running `npm run publishFeed` again

### "Invalid DID" errors
- Verify your `FEEDGEN_PUBLISHER_DID` is correct
- Make sure it starts with `did:plc:`

## 📝 License

MIT License - feel free to fork and modify!

## 🤝 Contributing

Pull requests welcome! Some ideas for improvements:
- Support for more URL patterns
- Better handle resolution caching
- Feed customization options
- Analytics dashboard

---

Built with ❤️ for the Bluesky community