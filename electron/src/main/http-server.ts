import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { chatMessageSchema, type ChatMessage } from '@gather-overlay/shared';

interface HttpServerHandle {
  readonly start: () => void;
  readonly stop: () => void;
}

type MessageHandler = (message: ChatMessage) => void;

const MAX_BODY_SIZE = 10 * 1024; // 10KB
const ALLOWED_ORIGIN = 'https://app.gather.town';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;

    req.on('data', (chunk: Buffer) => {
      totalSize += chunk.length;
      if (totalSize > MAX_BODY_SIZE) {
        req.destroy();
        reject(new Error('Request body too large'));
        return;
      }
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
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body));
}

export function createHttpServer(port: number, onMessage: MessageHandler): HttpServerHandle {
  let server: Server | null = null;

  function start(): void {
    if (port < 1 || port > 65535) {
      throw new Error(`Invalid port number: ${String(port)}. Must be between 1 and 65535.`);
    }

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
          .catch((error: unknown) => {
            const message =
              error instanceof SyntaxError
                ? 'Invalid JSON'
                : error instanceof Error && error.message === 'Request body too large'
                  ? 'Request body too large'
                  : 'Failed to read request body';
            const statusCode = message === 'Request body too large' ? 413 : 400;
            sendJson(res, statusCode, {
              success: false,
              error: message,
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
