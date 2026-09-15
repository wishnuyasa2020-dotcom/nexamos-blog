/**
 * NexaMOS Source URL Security & SSRF Guardrail Validator
 *
 * Sourced from NexaMOS Blog Phase 2C specifications
 * Mencegah eksploitasi Server-Side Request Forgery (SSRF) dan akses internal tak berizin.
 */

export interface SecurityValidationResult {
  allowed: boolean;
  reason?: string;
  normalizedUrl?: string;
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  '169.254.169.254' // Cloud instance metadata
]);

export class SourceSecurityValidator {
  validateUrl(rawUrl: string): SecurityValidationResult {
    if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
      return {
        allowed: false,
        reason: 'URL target kosong atau tidak valid.'
      };
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl.trim());
    } catch {
      return {
        allowed: false,
        reason: `URL '${rawUrl}' memiliki sintaks tidak valid.`
      };
    }

    // 1. Validasi Protokol (Hanya http dan https)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        allowed: false,
        reason: `Protokol '${parsed.protocol}' ditolak. Hanya protokol http: dan https: yang diizinkan.`
      };
    }

    const hostname = parsed.hostname.toLowerCase();

    // 2. Blokir hostname lokal terlarang eksplisit
    if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return {
        allowed: false,
        reason: `Host '${hostname}' dilarang karena merupakan alamat lokal atau internal cloud metadata.`
      };
    }

    // 3. Validasi Rentang IP Privat (IPv4)
    if (this.isPrivateIp(hostname)) {
      return {
        allowed: false,
        reason: `Alamat IP '${hostname}' dilarang karena berada dalam rentang private/internal IP (SSRF guardrail).`
      };
    }

    return {
      allowed: true,
      normalizedUrl: parsed.href
    };
  }

  private isPrivateIp(hostname: string): boolean {
    // Cek apakah hostname adalah format IPv4 (e.g. 192.168.1.1)
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!ipv4Match) return false;

    const [_, o1, o2, o3, o4] = ipv4Match.map(Number);
    if (o1 > 255 || o2 > 255 || o3 > 255 || o4 > 255) return false;

    // 10.0.0.0/8
    if (o1 === 10) return true;

    // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;

    // 192.168.0.0/16
    if (o1 === 192 && o2 === 168) return true;

    // 127.0.0.0/8 (Loopback)
    if (o1 === 127) return true;

    // 169.254.0.0/16 (Link-local)
    if (o1 === 169 && o2 === 254) return true;

    // 0.0.0.0/8
    if (o1 === 0) return true;

    return false;
  }
}
