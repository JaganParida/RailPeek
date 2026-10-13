export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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
