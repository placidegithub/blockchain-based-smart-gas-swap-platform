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
