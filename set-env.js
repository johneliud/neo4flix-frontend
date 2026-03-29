const fs = require('fs');

const apiUrl = process.env.API_URL;
const storageKey = process.env.STORAGE_KEY;

const content = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  storageKey: '${storageKey}',
};\n`;

fs.mkdirSync('src/environments', { recursive: true });
fs.writeFileSync('src/environments/environment.production.ts', content);

console.log(`environment.production.ts generated with apiUrl: ${apiUrl}`);
