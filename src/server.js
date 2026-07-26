import { createApp } from './app.js';

const port = Number(process.env.PORT) || 3000;
const app = createApp();

app.listen(port, '127.0.0.1', () => {
  console.log(`Spritesheet Player: http://127.0.0.1:${port}`);
});
