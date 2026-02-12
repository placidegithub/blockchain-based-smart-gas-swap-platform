import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatEther(value: bigint, decimals = 4): string {
  const divisor = BigInt(10 ** 18);
  const intPart = value / divisor;
  const fracPart = value % divisor;
  const fracString = fracPart.toString().padStart(18, '0').slice(0, decimals);
  return `${intPart}.${fracString}`;
}

export function parseEther(value: string): bigint {
  const [intPart, fracPart = ''] = value.split('.');
  const paddedFrac = fracPart.padEnd(18, '0').slice(0, 18);
  return BigInt(intPart) * BigInt(10 ** 18) + BigInt(paddedFrac);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateCylinderId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `CYL-${timestamp}-${randomPart}`.toUpperCase();
}

const VOUCHER_ID_MAP_KEY = 'gasswap_voucher_id_map';

export function formatVoucherId(numericId: bigint | string): string {
  const num = typeof numericId === 'bigint' ? Number(numericId) : parseInt(numericId.toString(), 10);
  if (isNaN(num)) return numericId.toString();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let hash = num * 2654435761;
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.abs(hash) % chars.length];
    hash = Math.floor(hash / chars.length) + num;
  }
  return `GSV-${code.slice(0, 4)}-${code.slice(4, 8)}`;
}

export function saveVoucherIdMapping(numericId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const formatted = formatVoucherId(numericId);
    const stored = localStorage.getItem(VOUCHER_ID_MAP_KEY);
    const map: Record<string, string> = stored ? JSON.parse(stored) : {};
    map[formatted.toUpperCase()] = numericId;
    map[numericId] = numericId;
    localStorage.setItem(VOUCHER_ID_MAP_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function resolveVoucherId(input: string): string | null {
  const trimmed = input.trim();

  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(VOUCHER_ID_MAP_KEY);
      if (stored) {
        const map: Record<string, string> = JSON.parse(stored);
        const found = map[trimmed.toUpperCase()];
        if (found) return found;
      }
    } catch {
      // ignore
    }
  }

  return null;
}
