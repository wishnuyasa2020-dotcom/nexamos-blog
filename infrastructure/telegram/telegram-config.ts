/**
 * NexaMOS Telegram Bot Configuration Layer
 *
 * Mengelola konfigurasi token bot Telegram dan ID pengguna yang diizinkan (Security Whitelist).
 * Mengamankan agar bot hanya merespons dan mengeksekusi aksi dari pengguna terverifikasi.
 */

export interface TelegramConfig {
  botToken: string;
  allowedUserId: string;
  apiBaseUrl: string;
}

export function loadTelegramConfig(): TelegramConfig {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || '';
  const allowedUserId = process.env.TELEGRAM_ALLOWED_USER_ID?.trim() || '';
  const apiBaseUrl = 'https://api.telegram.org';

  return {
    botToken,
    allowedUserId,
    apiBaseUrl
  };
}

export function isTelegramConfigured(config: TelegramConfig = loadTelegramConfig()): boolean {
  return Boolean(config.botToken && config.allowedUserId);
}

export function isUserAuthorized(userId: string | number, config: TelegramConfig = loadTelegramConfig()): boolean {
  if (!config.allowedUserId) return false;
  return String(userId).trim() === config.allowedUserId.trim();
}
