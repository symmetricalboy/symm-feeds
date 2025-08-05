"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const setup = async () => {
    console.log('🚀 Self Quote Feed Generator Setup');
    console.log('===================================\n');
    const envPath = path_1.default.join(process.cwd(), '.env');
    try {
        await promises_1.default.access(envPath);
        console.log('✅ .env file already exists!');
        console.log('Please check your configuration and update as needed.\n');
    }
    catch {
        try {
            const exampleEnv = await promises_1.default.readFile('.env.example', 'utf-8');
            await promises_1.default.writeFile('.env', exampleEnv);
            console.log('✅ Created .env file from template');
        }
        catch (err) {
            console.error('❌ Could not create .env file:', err);
            return;
        }
    }
    console.log('📋 Next Steps:');
    console.log('1. Edit your .env file with your configuration');
    console.log('2. Get your Bluesky DID: https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=YOUR-HANDLE.bsky.social');
    console.log('3. Create a Bluesky App Password: Settings → Privacy & Security → App Passwords');
    console.log('4. Deploy to Railway: https://railway.app');
    console.log('5. Run: npm run publishFeed');
    console.log('\n🎉 Your self-quote feed will be ready!');
};
setup().catch(console.error);
//# sourceMappingURL=setup.js.map