export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Handle CORS Preflight for any origin
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-bridge-token',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // 2. High-Performance IRCTC Online Charts Edge Proxy (Zero CORS block, Indian Cloudflare Edge routing)
    if (url.pathname.startsWith('/api/irctc/')) {
      const endpoint = url.pathname.replace('/api/irctc/', '');
      const irctcTarget = `https://www.irctc.co.in/online-charts/api/${endpoint}`;

      const irctcHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Origin': 'https://www.irctc.co.in',
        'Referer': 'https://www.irctc.co.in/online-charts/',
      };

      const body = request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : null;

      try {
        const response = await fetch(irctcTarget, {
          method: request.method,
          headers: irctcHeaders,
          body,
        });

        const data = await response.text();
        return new Response(data, {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-bridge-token',
            'Cache-Control': 'public, max-age=60',
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // 3. Proxy all other /api/* calls directly to the RailPeek backend
    if (url.pathname.startsWith('/api/')) {
      const targetUrl = new URL(url.pathname + url.search, 'https://rail-peek.vercel.app');

      const headers = new Headers(request.headers);
      headers.set('host', 'rail-peek.vercel.app');

      const proxyRequest = new Request(targetUrl.toString(), {
        method: request.method,
        headers: headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
        redirect: 'follow',
      });

      return fetch(proxyRequest);
    }

    // 4. Serve static assets (SPA index.html / CSS / JS)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('RailPeek Cloudflare Edge Ready', { status: 200 });
  },
};
