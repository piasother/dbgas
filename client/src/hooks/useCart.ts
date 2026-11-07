import { useSyncExternalStore } from 'react';
import type { Product } from '@shared/schema';

export interface CartItem {
  product: Product;
  quantity: number;
}

// One cart shared by every component (product cards, the floating cart button,
// the cart drawer, checkout). Previously each component had its own private copy,
// so "Add to Cart" never showed up anywhere else.
const STORAGE_KEY = 'db-gas-cart';
const MAX_QTY = 100;

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((i) => i && i.product && typeof i.product.id === 'number' && i.quantity > 0)
      : [];
  } catch {
    return [];
  }
}

let items: CartItem[] = typeof window !== 'undefined' ? load() : [];
const listeners = new Set<() => void>();

function setItems(next: CartItem[]) {
  items = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage full or blocked - cart still works for this visit */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Keep several open tabs in step.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      items = load();
      listeners.forEach((l) => l());
    }
  });
}

const getSnapshot = () => items;

export function useCart() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const addItem = (product: Product, quantity: number = 1) => {
    const existing = items.find((i) => i.product.id === product.id);
    if (existing) {
      setItems(
        items.map((i) =>
          i.product.id === product.id ? { ...i, product, quantity: Math.min(MAX_QTY, i.quantity + quantity) } : i,
        ),
      );
    } else {
      setItems([...items, { product, quantity: Math.min(MAX_QTY, quantity) }]);
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(items.map((i) => (i.product.id === productId ? { ...i, quantity: Math.min(MAX_QTY, quantity) } : i)));
  };

  const removeItem = (productId: number) => {
    setItems(items.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => setItems([]);

  const getTotalItems = () => current.reduce((t, i) => t + i.quantity, 0);
  const getTotalPrice = () => current.reduce((t, i) => t + i.product.price * i.quantity, 0);

  return { items: current, addItem, updateQuantity, removeItem, clearCart, getTotalItems, getTotalPrice };
}
