#!/bin/sh
set -e

echo "[api] Aplicando esquema (db push)..."
npx prisma db push --skip-generate --accept-data-loss

if [ -f prisma/seed.js ]; then
  echo "[api] Verificando seed..."
  node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findUnique({ where: { email: 'admin@cosmetia.demo' } }).then(u => {
  if (!u) {
    const { execSync } = require('child_process');
    console.log('[api] Corriendo seed...');
    execSync('npm run seed', { stdio: 'inherit' });
  } else {
    console.log('[api] Seed ya aplicado.');
  }
  return p.\$disconnect();
}).catch(e => { console.error(e); process.exit(1); });
"

  if [ -f prisma/seed-extra.js ]; then
    echo "[api] Seed extra (foros + backfill órdenes)..."
    npm run seed:extra
  fi
else
  echo "[api] Archivos de seed no incluidos en este build, omitiendo."
fi

echo "[api] Iniciando servidor..."
node dist/main.js
