#!/usr/bin/env node
/**
 * Reads DATABASE_URL from stdin (full URI, one line) and updates .env in project root.
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

function main() {
  let url = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (c) => { url += c; });
  process.stdin.on('end', () => {
    url = url.trim();
    if (!url) {
      console.error('No DATABASE_URL on stdin');
      process.exit(1);
    }
    let c = fs.readFileSync(envPath, 'utf8');
    if (/^DATABASE_URL=/m.test(c)) {
      c = c.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${url}`);
    } else {
      c += `\nDATABASE_URL=${url}\n`;
    }
    fs.writeFileSync(envPath, c);
    console.log('Updated DATABASE_URL in .env');
  });
}

main();
