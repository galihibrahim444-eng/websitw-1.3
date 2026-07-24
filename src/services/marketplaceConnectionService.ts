/**
 * MarketplaceConnectionService
 *
 * Sumber data untuk halaman Marketplace (pusat pengaturan koneksi).
 * Saat ini dummy + persist di localStorage. Nanti diganti dengan
 * pemanggilan Shopee/Tokopedia/TikTok/Lazada Open API tanpa mengubah
 * signature agar komponen UI tetap kompatibel.
 */
import type { MarketplaceName } from "./marketplaceAccountService";

export type { MarketplaceName };

export interface MarketplaceConnectionDetail {
  marketplace: MarketplaceName;
  connected: boolean;
  shopId: string;
  shopName: string;
  lastSync: string;
  autoSyncProduct: boolean;
  autoSyncOrder: boolean;
  autoSyncStock: boolean;
}

const STORAGE_KEY = "maqil.marketplaceConnections.v1";

const defaultConnections: MarketplaceConnectionDetail[] = [
  {
    marketplace: "Shopee",
    connected: true,
    shopId: "123456789",
    shopName: "Maqil Fashion Store",
    lastSync: "22 Jul 2026, 09:30",
    autoSyncProduct: true,
    autoSyncOrder: true,
    autoSyncStock: true,
  },
  {
    marketplace: "Tokopedia",
    connected: true,
    shopId: "TKP-778899",
    shopName: "Maqil Official",
    lastSync: "22 Jul 2026, 08:12",
    autoSyncProduct: true,
    autoSyncOrder: true,
    autoSyncStock: false,
  },
  {
    marketplace: "TikTok Shop",
    connected: true,
    shopId: "TTS-554433",
    shopName: "Maqil TikTok",
    lastSync: "21 Jul 2026, 21:45",
    autoSyncProduct: false,
    autoSyncOrder: true,
    autoSyncStock: true,
  },
  {
    marketplace: "Lazada",
    connected: true,
    shopId: "LZD-221100",
    shopName: "Maqil Lazada",
    lastSync: "20 Jul 2026, 15:02",
    autoSyncProduct: true,
    autoSyncOrder: false,
    autoSyncStock: true,
  },
];

type Listener = () => void;
const listeners = new Set<Listener>();

function readStorage(): MarketplaceConnectionDetail[] {
  if (typeof window === "undefined") return defaultConnections;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConnections;
    const parsed = JSON.parse(raw) as MarketplaceConnectionDetail[];
    // Merge default agar marketplace baru tetap muncul.
    return defaultConnections.map(
      (d) => parsed.find((p) => p.marketplace === d.marketplace) ?? d,
    );
  } catch {
    return defaultConnections;
  }
}

let cache: MarketplaceConnectionDetail[] = readStorage();

function writeStorage(next: MarketplaceConnectionDetail[]) {
  cache = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }
  listeners.forEach((l) => l());
}

export const MarketplaceConnectionService = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot(): MarketplaceConnectionDetail[] {
    return cache;
  },
  async list(): Promise<MarketplaceConnectionDetail[]> {
    return cache;
  },
  async get(
    marketplace: MarketplaceName,
  ): Promise<MarketplaceConnectionDetail | null> {
    return cache.find((c) => c.marketplace === marketplace) ?? null;
  },
  update(
    marketplace: MarketplaceName,
    patch: Partial<MarketplaceConnectionDetail>,
  ) {
    const next = cache.map((c) =>
      c.marketplace === marketplace ? { ...c, ...patch } : c,
    );
    writeStorage(next);
  },
  disconnect(marketplace: MarketplaceName) {
    this.update(marketplace, {
      connected: false,
      shopId: "",
      shopName: "",
      lastSync: "",
    });
  },
};
