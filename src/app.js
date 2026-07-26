import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.static(path.join(rootDirectory, 'public')));
  return app;
}
