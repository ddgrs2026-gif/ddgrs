/**
 * stress-test.js
 * Sends concurrent requests to the bot webhook to test rate limiting and stability.
 * Usage: node stress-test.js [url] [requests] [concurrency]
 */

const http = require('http');
const https = require('https');

const BOT_URL = process.argv[2] || 'http://localhost:3001';
const TOTAL_REQUESTS = parseInt(process.argv[3]) || 100;
const CONCURRENCY = parseInt(process.argv[4]) || 10;

// Fake WhatsApp webhook payload
function makePayload(phone, message) {
    return JSON.stringify({
        object: 'whatsapp_business_account',
        entry: [{
            changes: [{
                value: {
                    messages: [{
                        from: phone,
                        type: 'text',
                        text: { body: message }
                    }]
                }
            }]
        }]
    });
}

async function sendRequest(i) {
    const phone = `9190000${String(i).padStart(5, '0')}`
    const body = makePayload(phone, 'start');
    const url = new URL('/webhook', BOT_URL);
    const lib = url.protocol === 'https:' ? https : http;

    return new Promise((resolve) => {
        const start = Date.now();
        const req = lib.request({
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            resolve({ status: res.statusCode, time: Date.now() - start, index: i });
            res.resume();
        });

        req.on('error', (e) => {
            resolve({ status: 'ERROR', error: e.message, time: Date.now() - start, index: i });
        });

        req.setTimeout(5000, () => {
            req.destroy();
            resolve({ status: 'TIMEOUT', time: 5000, index: i });
        });

        req.write(body);
        req.end();
    });
}

async function runBatch(start, size) {
    const promises = [];
    for (let i = start; i < start + size && i < TOTAL_REQUESTS; i++) {
        promises.push(sendRequest(i));
    }
    return Promise.all(promises);
}

async function main() {
    console.log(`\n🚀 Stress Test`);
    console.log(`URL: ${BOT_URL}/webhook`);
    console.log(`Total requests: ${TOTAL_REQUESTS}`);
    console.log(`Concurrency: ${CONCURRENCY}\n`);

    const results = [];
    const startTime = Date.now();

    for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENCY) {
        const batch = await runBatch(i, CONCURRENCY);
        results.push(...batch);
        process.stdout.write(`\r Progress: ${Math.min(i + CONCURRENCY, TOTAL_REQUESTS)}/${TOTAL_REQUESTS}`);
    }

    const totalTime = Date.now() - startTime;
    const success = results.filter(r => r.status === 200).length;
    const rateLimited = results.filter(r => r.status === 429).length;
    const errors = results.filter(r => r.status === 'ERROR' || r.status === 'TIMEOUT').length;
    const avgTime = Math.round(results.reduce((s, r) => s + r.time, 0) / results.length);

    console.log(`\n\n📊 Results:`);
    console.log(`✅ 200 OK:        ${success}`);
    console.log(`🚫 429 Rate limit: ${rateLimited}`);
    console.log(`❌ Errors/timeout: ${errors}`);
    console.log(`⏱  Total time:    ${totalTime}ms`);
    console.log(`⚡ Avg response:  ${avgTime}ms`);
    console.log(`📈 Req/sec:       ${Math.round(TOTAL_REQUESTS / (totalTime / 1000))}`);
}

main();
