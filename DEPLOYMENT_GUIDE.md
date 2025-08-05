# 🚀 Self Quote Feed Generator - Railway Deployment Guide

This guide will walk you through deploying your self-quote feed generator to Railway.

## 🎯 What This Does

Your feed generator will:
- Monitor Bluesky for posts where people link to their own profiles or posts
- Create a custom feed called "Self Quotes" 
- Make it discoverable on Bluesky for anyone to subscribe to

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Bluesky Account**: You need a Bluesky account to publish the feed
3. **GitHub Account**: To fork this repository
4. **Your Bluesky DID**: We'll help you find this

## 🔍 Step 1: Find Your Bluesky DID

Your DID (Decentralized Identifier) is like your unique ID on Bluesky.

### Method 1: API Call
```bash
curl "https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=YOUR-HANDLE.bsky.social"
```

Replace `YOUR-HANDLE` with your actual handle. Look for the `"did"` field in the response.

### Method 2: Browser Developer Tools
1. Go to `https://bsky.app/profile/YOUR-HANDLE`
2. View page source (Ctrl+U)
3. Search for `"did:plc:`
4. Copy the full DID (starts with `did:plc:`)

**Example DID**: `did:plc:abc123xyz789...` (about 32 characters long)

## 🔑 Step 2: Create App Password

1. Go to Bluesky Settings → Privacy & Security → App Passwords
2. Click "Add App Password"
3. Name it "Feed Generator" 
4. Copy the generated password (format: `abcd-efgh-ijkl-mnop`)

⚠️ **Important**: Use the App Password, NOT your regular Bluesky password!

## 🚀 Step 3: Deploy to Railway

### A. Fork This Repository
1. Go to [your forked repository]
2. Click "Fork" to create your own copy

### B. Connect to Railway
1. Go to [railway.app](https://railway.app)
2. Click "Deploy from GitHub repo"
3. Select your forked repository
4. Railway will auto-detect the Dockerfile

### C. Configure Environment Variables

In Railway, go to your deployed service → "Variables" tab and add these **3 simple variables**:

| Variable | Value | Example |
|----------|-------|---------|
| `BLUESKY_DID` | Your Bluesky DID | `did:plc:abc123xyz789...` |
| `BLUESKY_HANDLE` | Your Bluesky handle | `alice.bsky.social` |
| `BLUESKY_PASSWORD` | Your app password | `abcd-efgh-ijkl-mnop` |

**That's it!** Railway automatically provides:
- `PORT` (for the server port)
- `RAILWAY_PUBLIC_DOMAIN` (for your app's domain)

Your feed generator automatically builds the service DID as `did:web:your-railway-domain.railway.app`

### D. Deploy
Railway will automatically build and deploy your feed generator. Wait for the deployment to complete.

## 📡 Step 4: Publish Your Feed

Once deployed, publish your feed to Bluesky:

1. **SSH into Railway** (or use Railway's web terminal):
   ```bash
   railway shell
   ```

2. **Publish the feed**:
   ```bash
   npm run publishFeed
   ```

3. **Success message**: You should see:
   ```
   🎉 Successfully published Self Quote feed generator!
   Feed URI: at://your-did/app.bsky.feed.generator/self-quotes
   ```

## 🧪 Step 5: Test Your Feed

### A. Check the API
Visit your Railway domain to see feed stats:
```
https://your-app.railway.app/
```

You should see JSON with feed information and statistics.

### B. View on Bluesky
1. Go to: `https://bsky.app/profile/YOUR-HANDLE/feed/self-quotes`
2. Your custom feed should be visible!
3. Share this URL with others so they can subscribe

### C. Test Self-Quotes
Create a test post on Bluesky that links to your profile:
```
Check out my profile! https://bsky.app/profile/YOUR-HANDLE
```

Your post should appear in the feed (may take a few minutes).

## 🔧 Troubleshooting

### "Feed not found" on Bluesky
- Wait 5-10 minutes for Bluesky to sync
- Check that your Railway app is running and accessible
- Try republishing: `npm run publishFeed`

### "Authentication failed" 
- Double-check your `BLUESKY_HANDLE` and `BLUESKY_PASSWORD`
- Ensure you're using an App Password, not your regular password
- Try creating a new App Password

### "Invalid DID" errors
- Verify your `BLUESKY_DID` is correct and starts with `did:plc:`
- Use the API method to get your DID if unsure

### No posts in feed
- The feed starts empty and populates as people post self-quotes
- You can create test posts linking to your own profile
- Check Railway logs for any errors: `railway logs`

### Server not starting
- Check Railway deployment logs
- Verify all environment variables are set correctly
- Make sure the build completed successfully

## 📊 Monitoring

### View Logs
```bash
railway logs
```

### Check Feed Status
Your feed provides real-time stats at:
```
https://your-app.railway.app/
```

### Update Feed
To update your feed after code changes:
```bash
git push origin main
```
Railway will automatically redeploy.

## 🎉 Success!

Your self-quote feed generator is now live! Here's what happens next:

1. **Automatic Detection**: Your server monitors Bluesky for self-quotes
2. **Real-time Updates**: New self-quotes appear in your feed automatically  
3. **Public Discovery**: Anyone can subscribe to your feed
4. **Zero Maintenance**: Runs completely automated

Share your feed URL and watch the community discover interesting self-quoting behavior!

---

## 💡 Next Steps

- **Customize**: Modify the detection logic in `src/algos/self-quotes.ts`
- **Enhance**: Add more types of self-references to detect
- **Analytics**: Build a dashboard to show feed statistics
- **Community**: Share your feed and get feedback

## 🆘 Need Help?

- Check Railway's documentation: [docs.railway.app](https://docs.railway.app)
- Bluesky feed development: [atproto.com](https://atproto.com)
- Open an issue in this repository for bugs or questions

Happy self-quote hunting! 🎯