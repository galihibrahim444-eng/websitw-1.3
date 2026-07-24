import { useSyncExternalStore } from "react";
import type { PesananRow, PesananStatus } from "@/data/pesanan";

// Sumber data tunggal untuk seluruh modul Pesanan dengan persistensi
// localStorage. Layer akses tunggal ini disiapkan agar dapat digantikan
// dengan REST API / Shopee Open API tanpa mengubah UI:
// - `getAll()` = SELECT
// - `updateStatus()` = UPDATE ... WHERE id IN (...)
// - `incrementPrintCount()` = UPDATE ... SET print_count = print_count + 1

const STORAGE_KEY = "maqilerp-orders";

function loadOrders(): PesananRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PesananRow[]) : [];
  } catch {
    return [];
  }
}

function saveOrders(items: PesananRow[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Abaikan kegagalan quota; state in-memory tetap akurat.
  }
}

let state: PesananRow[] = loadOrders();
const listeners = new Set<() => void>();

const emit = () => {
  for (const l of listeners) l();
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const getSnapshot = () => state;

const commit = (next: PesananRow[]) => {
  state = next;
  saveOrders(state);
  emit();
};

export const pesananStore = {
  getAll(): PesananRow[] {
    return state;
  },
  getById(id: string): PesananRow | undefined {
    return state.find((r) => r.id === id);
  },
  addOrder(order: PesananRow) {
    commit([order, ...state]);
  },
  updateStatus(ids: Iterable<string>, status: PesananStatus) {
    const set = new Set(ids);
    if (set.size === 0) return;
    let changed = false;
    const next = state.map((r) => {
      if (set.has(r.id) && r.status !== status) {
        changed = true;
        return { ...r, status };
      }
      return r;
    });
    if (changed) commit(next);
  },
  incrementPrintCount(ids: Iterable<string>) {
    const set = new Set(ids);
    if (set.size === 0) return;
    const next = state.map((r) =>
      set.has(r.id) ? { ...r, printCount: r.printCount + 1 } : r,
    );
    commit(next);
  },
  deleteOrder(id: string) {
    const next = state.filter((r) => r.id !== id);
    if (next.length !== state.length) commit(next);
  },
  subscribe,
};

export function usePesanan(): PesananRow[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
