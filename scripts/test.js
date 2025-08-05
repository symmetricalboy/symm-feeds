"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const self_quotes_1 = require("../src/algos/self-quotes");
const runTests = () => {
    console.log('🧪 Testing Self Quote Detection');
    console.log('===============================\n');
    const testCases = [
        {
            name: 'Profile self-link',
            authorDid: 'did:plc:abc123',
            authorHandle: 'alice.bsky.social',
            text: 'Check out my profile! https://bsky.app/profile/alice.bsky.social',
            expected: true
        },
        {
            name: 'Post self-link',
            authorDid: 'did:plc:def456',
            authorHandle: 'bob.bsky.social',
            text: 'Here\'s my post: https://bsky.app/profile/bob.bsky.social/post/xyz789',
            expected: true
        },
        {
            name: 'Handle without @ prefix',
            authorDid: 'did:plc:ghi789',
            authorHandle: '@charlie.bsky.social',
            text: 'Follow me: https://bsky.app/profile/charlie.bsky.social',
            expected: true
        },
        {
            name: 'Different user link (should not match)',
            authorDid: 'did:plc:abc123',
            authorHandle: 'alice.bsky.social',
            text: 'Check out Bob: https://bsky.app/profile/bob.bsky.social',
            expected: false
        },
        {
            name: 'No links in text',
            authorDid: 'did:plc:abc123',
            authorHandle: 'alice.bsky.social',
            text: 'Just a regular post with no links!',
            expected: false
        },
        {
            name: 'External link (not Bluesky)',
            authorDid: 'did:plc:abc123',
            authorHandle: 'alice.bsky.social',
            text: 'Check out my website: https://alice.com',
            expected: false
        }
    ];
    let passed = 0;
    let failed = 0;
    for (const testCase of testCases) {
        const result = (0, self_quotes_1.detectSelfQuote)(testCase.authorDid, testCase.authorHandle, testCase.text);
        const success = result.isSelfQuote === testCase.expected;
        if (success) {
            console.log(`✅ ${testCase.name}`);
            passed++;
        }
        else {
            console.log(`❌ ${testCase.name}`);
            console.log(`   Expected: ${testCase.expected}, Got: ${result.isSelfQuote}`);
            if (result.isSelfQuote) {
                console.log(`   Type: ${result.type}, URL: ${result.matchedUrl}`);
            }
            failed++;
        }
    }
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    if (failed === 0) {
        console.log('🎉 All tests passed! Your self-quote detection is working correctly.');
    }
    else {
        console.log('❌ Some tests failed. Please check the algorithm.');
        process.exit(1);
    }
};
runTests();
//# sourceMappingURL=test.js.map