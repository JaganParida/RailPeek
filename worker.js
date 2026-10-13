export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/test-cf-irctc') {
      const today = new Date().toISOString().slice(0, 10);
      try {
        const res = await fetch('https://www.irctc.co.in/online-charts/api/trainComposition', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.irctc.co.in/online-charts/',
            'Origin': 'https://www.irctc.co.in',
          },
          body: JSON.stringify({ trainNo: '12801', jDate: today, boardingStation: 'PURI' }),
        });
        const text = await res.text();
        let json = null;
        try { json = JSON.parse(text); } catch (_e) {}
        return new Response(
          JSON.stringify({
            status: res.status,
            success: res.status === 200,
            trainName: json?.trainName,
            chartDate: json?.chartOneDate,
            rawText: text.slice(0, 300),
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Proxy all /api/* calls directly to the RailPeek backend
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

    // Serve static assets (SPA index.html / CSS / JS)
    return env.ASSETS.fetch(request);
  },
};
