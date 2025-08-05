# 🚀 Super Simple Railway Deployment

Deploy your self-quote feed generator in 5 minutes!

## 📋 What You Need

1. **Your Bluesky DID** - Get it here:
   ```
   https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=YOUR-HANDLE.bsky.social
   ```
   Copy the `"did"` value (starts with `did:plc:`)

2. **Bluesky App Password** - Go to Settings → Privacy & Security → App Passwords

## 🚀 Deploy Steps

### 1. Fork & Deploy
- Fork this repo to your GitHub
- Go to [railway.app](https://railway.app) 
- Click "Deploy from GitHub repo"
- Select your forked repo

### 2. Set 3 Environment Variables
In Railway → Variables tab:

```
BLUESKY_DID=did:plc:your-actual-did-here
BLUESKY_HANDLE=your-handle.bsky.social  
BLUESKY_PASSWORD=your-app-password-here
```

### 3. Deploy & Publish
- Railway auto-deploys
- SSH into Railway: `railway shell`
- Run: `npm run publishFeed`

### 4. Share Your Feed
Your feed URL: `https://bsky.app/profile/YOUR-HANDLE/feed/self-quotes`

## ✅ Done!

Railway automatically handles:
- ✅ Port configuration (`PORT`)
- ✅ Domain setup (`RAILWAY_PUBLIC_DOMAIN`) 
- ✅ Service DID (`did:web:your-domain.railway.app`)
- ✅ SSL certificates
- ✅ Auto-restart

Your feed generator is now live and detecting self-quotes! 🎉

---

**Need help?** Check the full [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for troubleshooting.