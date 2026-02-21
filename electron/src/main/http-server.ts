import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { chatMessageSchema, type ChatMessage } from '@gather-overlay/shared';

interface HttpServerHandle {
  readonly start: () => void;
  readonly stop: () => void;
}

type MessageHandler = (message: ChatMessage) => void;

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf-8'));
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body));
}

export function createHttpServer(port: number, onMessage: MessageHandler): HttpServerHandle {
  let server: Server | null = null;

  function start(): void {
    server = createServer((req, res) => {
      // CORS preflight
      if (req.method === 'OPTIONS') {
        sendJson(res, 204, null);
        return;
      }

      if (req.method === 'POST' && req.url === '/api/messages') {
        readBody(req)
          .then((body) => {
            const parsed: unknown = JSON.parse(body);
            const result = chatMessageSchema.safeParse(parsed);

            if (!result.success) {
              sendJson(res, 400, {
                success: false,
                error: 'Invalid message format',
              });
              return;
            }

            onMessage(result.data);
            sendJson(res, 200, { success: true });
          })
          .catch(() => {
            sendJson(res, 400, {
              success: false,
              error: 'Invalid JSON',
            });
          });
        return;
      }

      sendJson(res, 404, { success: false, error: 'Not found' });
    });

    server.listen(port, '127.0.0.1');
  }

  function stop(): void {
    server?.close();
    server = null;
  }

  return { start, stop };
}
