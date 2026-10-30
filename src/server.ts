import { app } from './app.js';
import { env } from './config/env.js';

const port = env.PORT;

app.listen(port, () => {
  console.log(`Workshop House running at http://localhost:${port} in ${env.NODE_ENV} mode`);
});
