/// <reference path="../tests/ambient.d.ts" />
/**
 * NexaMOS Telegram Editorial Bot Runner
 *
 * Sourced from NexaMOS Mobile Publishing Workflow specifications.
 * Menjalankan bot Telegram dalam mode daemon / background long-polling.
 *
 * Jalankan via CLI:
 * npm run bot
 */

import { TelegramEditorialBot } from '../agent/telegram-editorial-bot.ts';
import { loadTelegramConfig, isTelegramConfigured } from '../infrastructure/telegram/telegram-config.ts';


async function main() {
  const config = loadTelegramConfig();

  if (!isTelegramConfigured(config)) {
    console.error('[FATAL] TELEGRAM_BOT_TOKEN atau TELEGRAM_ALLOWED_USER_ID belum disetel di .env.local.');
    process.exit(1);
  }

  const bot = new TelegramEditorialBot();

  // Tangani graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nMenerima sinyal SIGINT. Menghentikan bot...');
    bot.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nMenerima sinyal SIGTERM. Menghentikan bot...');
    bot.stop();
    process.exit(0);
  });

  await bot.start();
}

main().catch((err) => {
  console.error('[FATAL] Bot gagal dijalankan:', err);
  process.exit(1);
});
