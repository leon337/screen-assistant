import { initializeAuthGate } from './auth-v20-ui.js';

await initializeAuthGate();
await Promise.all([
  import('./app.js'),
  import('./design.js'),
]);
