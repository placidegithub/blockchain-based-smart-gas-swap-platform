'use client';

const STAFF_REGISTRY_KEY = 'gasswap_staff_registry';

export interface StaffRegistryEntry {
  address: string;
  privateKey?: string;
  companyId: number;
  branchId: number;
  branchName: string;
  companyName?: string;
  district?: string;
  createdAt: string;
}

// Save to localStorage
function getRegistry(): StaffRegistryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STAFF_REGISTRY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRegistry(entries: StaffRegistryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STAFF_REGISTRY_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save staff registry:', e);
  }
}

export function registerStaff(entry: StaffRegistryEntry): void {
  const registry = getRegistry();
  // Avoid duplicates by address
  const existing = registry.findIndex(e => e.address.toLowerCase() === entry.address.toLowerCase());
  if (existing >= 0) {
    registry[existing] = entry;
  } else {
    registry.push(entry);
  }
  saveRegistry(registry);

  // Also persist to server-side file via API
  persistToServer(registry).catch(err => {
    console.error('Failed to persist staff registry to server:', err);
  });
}

export function getRegisteredStaff(): StaffRegistryEntry[] {
  return getRegistry();
}

export function removeStaff(address: string): void {
  const registry = getRegistry().filter(e => e.address.toLowerCase() !== address.toLowerCase());
  saveRegistry(registry);
  persistToServer(registry).catch(err => {
    console.error('Failed to persist staff registry to server:', err);
  });
}

async function persistToServer(registry: StaffRegistryEntry[]): Promise<void> {
  try {
    await fetch('/api/staff-registry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: registry }),
    });
  } catch (e) {
    console.error('Failed to save staff registry to server:', e);
  }
}

// Load from server and merge with localStorage
export async function syncRegistryFromServer(): Promise<StaffRegistryEntry[]> {
  try {
    const res = await fetch('/api/staff-registry');
    if (res.ok) {
      const data = await res.json();
      if (data.entries && Array.isArray(data.entries)) {
        // Merge: server entries take priority
        const localRegistry = getRegistry();
        const merged = [...data.entries];
        for (const local of localRegistry) {
          if (!merged.some(e => e.address.toLowerCase() === local.address.toLowerCase())) {
            merged.push(local);
          }
        }
        saveRegistry(merged);
        return merged;
      }
    }
  } catch {
    // Fallback to localStorage
  }
  return getRegistry();
}
