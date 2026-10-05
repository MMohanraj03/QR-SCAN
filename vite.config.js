import { defineConfig } from 'vite';
import os from 'os';

// In-memory cache for multi-device cross-network scanning
const resumesCache = new Map();

// Helper to find LAN IP address
function getLocalNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  plugins: [
    {
      name: 'resume-qr-api-sync',
      configureServer(server) {
        // API: Get host LAN IP for automatic QR host configuration
        server.middlewares.use('/api/network-ip', (req, res) => {
          const ip = getLocalNetworkIp();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ip, host: `http://${ip}:5173` }));
        });

        // API: Save / Sync Resume across devices
        server.middlewares.use('/api/resume', (req, res, next) => {
          if (req.method === 'POST') {
            const chunks = [];
            req.on('data', chunk => { chunks.push(chunk); });
            req.on('end', () => {
              try {
                const bodyStr = Buffer.concat(chunks).toString('utf-8');
                const data = JSON.parse(bodyStr);
                if (data && data.id) {
                  resumesCache.set(data.id, data);
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, id: data.id }));
                  return;
                }
              } catch (e) {
                console.error('Error parsing POST body:', e);
              }
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid resume data' }));
            });
            return;
          }

          if (req.method === 'GET') {
            const cleanUrl = req.url.split('?')[0];
            const urlParts = cleanUrl.split('/').filter(Boolean);
            const id = urlParts[urlParts.length - 1] || new URL(req.url, 'http://localhost').searchParams.get('id');

            if (id && resumesCache.has(id)) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(resumesCache.get(id)));
              return;
            }
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Resume not found' }));
            return;
          }

          next();
        });
      }
    }
  ]
});
