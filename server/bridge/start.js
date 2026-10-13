import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { startBridgeServer } from './server.js';

dotenv.config();

const PORT = process.env.BRIDGE_PORT || 5050;
const BRIDGE_TOKEN = process.env.IRCTC_BRIDGE_TOKEN || 'railpeek-live-bridge';
const NGROK_AUTHTOKEN = process.env.NGROK_AUTHTOKEN;
const NGROK_DOMAIN = process.env.NGROK_DOMAIN;

console.log('\n======================================================');
console.log('🚀 Starting RailPeek Indian IRCTC Bridge...');
console.log('======================================================');

await startBridgeServer(PORT);

if (NGROK_AUTHTOKEN && NGROK_DOMAIN) {
  console.log(`[Tunnel] Launching Permanent Ngrok Ingress (${NGROK_DOMAIN})...`);
  try {
    const { default: ngrok } = await import('@ngrok/ngrok');
    const listener = await ngrok.forward({
      addr: Number(PORT),
      authtoken: NGROK_AUTHTOKEN,
      domain: NGROK_DOMAIN,
    });

    const tunnelUrl = listener.url();
    console.log('\n========================================================================');
    console.log('🎉 SUCCESS! Your Permanent Indian IRCTC Bridge is LIVE on the Internet:');
    console.log(`👉 Bridge URL:   ${tunnelUrl}`);
    console.log(`👉 Bridge Token: ${BRIDGE_TOKEN}`);
    console.log('========================================================================');
    console.log('\n📋 SET THIS ONCE in your Vercel Project Environment Variables:');
    console.log(`   IRCTC_BRIDGE_URL = ${tunnelUrl}`);
    console.log(`   IRCTC_BRIDGE_TOKEN = ${BRIDGE_TOKEN}`);
    console.log('   (This URL is PERMANENT and will NEVER change!)');
    console.log('========================================================================\n');

    process.on('SIGINT', async () => {
      console.log('\nShutting down bridge...');
      await listener.close();
      process.exit(0);
    });
  } catch (err) {
    console.error('[Ngrok Tunnel Error]', err.message);
  }
} else {
  console.log('[Tunnel] Launching Cloudflare Tunnel for localhost:' + PORT + '...');

  const cloudflared = spawn(
    'npx',
    ['--yes', 'cloudflared', 'tunnel', '--url', `http://localhost:${PORT}`],
    {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  let tunnelUrlFound = false;

  function parseOutput(data) {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !tunnelUrlFound) {
      tunnelUrlFound = true;
      const tunnelUrl = match[0];
      console.log('\n========================================================================');
      console.log('🎉 SUCCESS! Your Indian IRCTC Bridge is LIVE on the Internet:');
      console.log(`👉 Bridge URL:   ${tunnelUrl}`);
      console.log(`👉 Bridge Token: ${BRIDGE_TOKEN}`);
      console.log('========================================================================');
      console.log('\n📋 NEXT STEP: Set this in your Vercel Project Environment Variables:');
      console.log(`   IRCTC_BRIDGE_URL = ${tunnelUrl}`);
      console.log(`   IRCTC_BRIDGE_TOKEN = ${BRIDGE_TOKEN}`);
      console.log('========================================================================\n');
    }
  }

  cloudflared.stdout.on('data', parseOutput);
  cloudflared.stderr.on('data', parseOutput);

  cloudflared.on('error', (err) => {
    console.error('[Tunnel Error]', err.message);
  });

  process.on('SIGINT', () => {
    console.log('\nShutting down bridge...');
    cloudflared.kill();
    process.exit(0);
  });
}
