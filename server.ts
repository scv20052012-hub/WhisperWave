import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'WhisperWave E2EE Messaging & WebRTC Server',
    e2ee: 'AES-256-GCM / WebRTC DTLS-SRTP',
  });
});

// Serve frontend static files in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = http.createServer(app);

// WebSocket server for real-time WebRTC signaling and messaging
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (data: string) => {
    try {
      const parsed = JSON.parse(data.toString());
      // Broadcast to all other connected peers
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(parsed));
        }
      });
    } catch {
      // Ignore invalid payloads
    }
  });

  ws.on('error', () => {
    // Suppress error
  });
});

server.listen(port, () => {
  console.log(`WhisperWave server running on port ${port}`);
});
