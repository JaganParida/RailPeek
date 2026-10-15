import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || process.env.BRIDGE_PORT || 5050;
const BRIDGE_TOKEN = process.env.IRCTC_BRIDGE_TOKEN || 'railpeek-live-bridge';

app.use(cors());
app.use(express.json());

const IRCTC_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.irctc.co.in/online-charts/',
  'Origin': 'https://www.irctc.co.in',
};

// Security token check (optional, protects from unauthorized traffic)
function authMiddleware(req, res, next) {
  const token = req.headers['x-bridge-token'] || req.query.token;
  if (BRIDGE_TOKEN && token !== BRIDGE_TOKEN) {
    return res.status(401).json({ success: false, error: 'Unauthorized bridge request' });
  }
  next();
}

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    bridge: 'RailPeek Indian Residential Proxy',
    timestamp: new Date().toISOString(),
  });
});

async function forwardToIrctc(endpoint, body, res) {
  try {
    const scrapeOpsKey = process.env.SCRAPEOPS_API_KEY;
    let irctcUrl = `https://www.irctc.co.in/online-charts/api/${endpoint}`;
    if (scrapeOpsKey) {
      irctcUrl = `https://proxy.scrapeops.io/v1/?api_key=${scrapeOpsKey}&url=${encodeURIComponent(irctcUrl)}&country=in&residential=true&keep_headers=true`;
    }
    console.log(`[Bridge] Forwarding request to IRCTC -> ${endpoint} (Train: ${body?.trainNo})`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(irctcUrl, {
      method: 'POST',
      headers: IRCTC_HEADERS,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await response.json().catch(async () => {
      const txt = await response.text().catch(() => '');
      return { error: `IRCTC non-JSON response: ${txt.slice(0, 100)}` };
    });

    console.log(`[Bridge] IRCTC responded HTTP ${response.status} for ${endpoint}`);
    res.status(response.status).json(data);
  } catch (err) {
    console.error(`[Bridge] Forwarding error:`, err.message);
    res.status(502).json({ success: false, error: err.message });
  }
}

app.post('/api/irctc/trainComposition', authMiddleware, (req, res) => {
  forwardToIrctc('trainComposition', req.body, res);
});

app.post('/api/irctc/coachComposition', authMiddleware, (req, res) => {
  forwardToIrctc('coachComposition', req.body, res);
});

app.post('/api/irctc/vacantBerth', authMiddleware, (req, res) => {
  forwardToIrctc('vacantBerth', req.body, res);
});

export function startBridgeServer(port = PORT) {
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`[Bridge] Local IRCTC Bridge running on http://localhost:${port}`);
      resolve(server);
    });
  });
}

if (process.argv[1]?.endsWith('server.js')) {
  startBridgeServer(PORT);
}
