"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const api_1 = require("@atproto/api");
dotenv_1.default.config();
const run = async () => {
    if (!process.env.FEEDGEN_SERVICE_DID) {
        throw new Error('Please provide a FEEDGEN_SERVICE_DID in your .env file');
    }
    if (!process.env.FEEDGEN_PUBLISHER_DID) {
        throw new Error('Please provide a FEEDGEN_PUBLISHER_DID in your .env file');
    }
    if (!process.env.BLUESKY_HANDLE) {
        throw new Error('Please provide your BLUESKY_HANDLE in your .env file');
    }
    if (!process.env.BLUESKY_PASSWORD) {
        throw new Error('Please provide your BLUESKY_PASSWORD in your .env file');
    }
    const agent = new api_1.BskyAgent({ service: 'https://bsky.social' });
    await agent.login({
        identifier: process.env.BLUESKY_HANDLE,
        password: process.env.BLUESKY_PASSWORD,
    });
    console.log('✅ Logged in to Bluesky');
    const feedGenRecord = {
        did: process.env.FEEDGEN_SERVICE_DID,
        displayName: 'Self Quotes',
        description: 'A feed of posts where people quote themselves - linking to their own profiles or posts',
        avatar: undefined,
        createdAt: new Date().toISOString(),
    };
    try {
        await agent.com.atproto.repo.putRecord({
            repo: agent.session?.did ?? '',
            collection: 'app.bsky.feed.generator',
            rkey: 'self-quotes',
            record: feedGenRecord,
        });
        console.log('🎉 Successfully published Self Quote feed generator!');
        console.log(`Feed URI: at://${agent.session?.did}/app.bsky.feed.generator/self-quotes`);
        console.log('');
        console.log('Your feed should now be discoverable on Bluesky!');
        console.log(`Share this URL: https://bsky.app/profile/${agent.session?.did}/feed/self-quotes`);
    }
    catch (err) {
        console.error('❌ Failed to publish feed generator:', err);
    }
};
run().catch(console.error);
//# sourceMappingURL=publishFeedGen.js.map