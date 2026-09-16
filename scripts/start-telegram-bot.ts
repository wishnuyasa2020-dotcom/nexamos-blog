/// <reference path="../tests/ambient.d.ts" />
/**
 * NexaMOS Telegram Editorial Bot Runner
 *
 * Sourced from NexaMOS Mobile Publishing Workflow specifications.
 * Menjalankan bot Telegram dalam mode daemon / background long-polling
 * dan menyediakan HTTP healthcheck server untuk cloud container (Koyeb/Render).
 *
 * Jalankan via CLI:
 * npm run bot
 */

import http from 'node:http';
import { TelegramEditorialBot } from '../agent/telegram-editorial-bot.ts';
import { loadTelegramConfig, isTelegramConfigured } from '../infrastructure/telegram/telegram-config.ts';

async function main() {
  const config = loadTelegramConfig();

  if (!isTelegramConfigured(config)) {
    console.error('[FATAL] TELEGRAM_BOT_TOKEN atau TELEGRAM_ALLOWED_USER_ID belum disetel di .env.local.');
    process.exit(1);
  }

  // Mini HTTP Healthcheck server untuk Koyeb / Cloud Containers
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'healthy',
        service: 'nexamos-telegram-editorial-bot',
        timestamp: new Date().toISOString()
      })
    );
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[HTTP] Cloud healthcheck server berjalan di port ${port}`);
  });

  let bot = new TelegramEditorialBot();
  let isShuttingDown = false;

  const shutdown = () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    try {
      bot.stop();
    } catch {
      // ignore
    }
    server.close(() => {
      process.exit(0);
    });
    // Fallback force exit jika graceful close menggantung lebih dari 5 detik
    const forceExitTimer: any = setTimeout(() => process.exit(0), 5000);
    if (forceExitTimer && typeof forceExitTimer.unref === 'function') {
      forceExitTimer.unref();
    }
  };

  // Tangani graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nMenerima sinyal SIGINT. Menghentikan bot...');
    shutdown();
  });

  process.on('SIGTERM', () => {
    console.log('\nMenerima sinyal SIGTERM. Menghentikan bot...');
    shutdown();
  });

  // Supervisor loop: Pastikan bot me-restart jika terjadi fatal runtime error tanpa mematikan HTTP server
  while (!isShuttingDown) {
    try {
      await bot.start();
      break; // Normal stop jika bot.stop() dipanggil
    } catch (err: any) {
      if (isShuttingDown) break;
      console.error('[ERROR] Bot unhandled exception:', err?.message || err);
      console.log('Mencoba me-restart bot dalam 5 detik... (HTTP healthcheck server tetap aktif)');
      await new Promise((r) => setTimeout(r, 5000));
      bot = new TelegramEditorialBot();
    }
  }
}

main().catch((err) => {
  console.error('[FATAL] Server runner gagal diinisialisasi:', err);
  process.exit(1);
});

