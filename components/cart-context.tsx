"use client";

/**
 * Cart Context — global shopping cart state
 *
 * Plain-English explanation:
 * React "context" is a way to share data across the whole app without
 * passing it down through every component manually. Think of it like a
 * global variable that any component can read or update.
 *
 * This file creates a "cart" that:
 *  - stores items the user has added
 *  - persists to localStorage (survives page refresh)
 *  - exposes helpers: addItem, removeItem, updateQty, clearCart
 *  - computes totalItems (badge count) and totalCents (for checkout)
 */

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────
export type CartItem = {
  id: string;
  name: string;
  price: number;        // price in cents (e.g. 800 = $8.00)
  priceDisplay: string; // human-readable (e.g. "$8")
  unit: string;         // e.g. "per 5 lb bag"
  quantity: number;
};

type CartState = { items: CartItem[] };

type CartAction =
  | { type: "ADD"; item: Omit<CartItem, "quantity"> }
  | { type: "REMOVE"; id: string }
  | { type: "UPDATE_QTY"; id: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "LOAD"; payload: CartState };

// ─── Reducer ──────────────────────────────────────────────
// A "reducer" is just a function that takes the current state and an action
// and returns the new state. Switch statement handles each action type.
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.find((i) => i.id === action.item.id);
      if (existing) {
        // Item already in cart — increment quantity
        return {
          items: state.items.map((i) =>
            i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      // New item — add with quantity 1
      return { items: [...state.items, { ...action.item, quantity: 1 }] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.id !== action.id) };
    case "UPDATE_QTY":
      if (action.quantity <= 0) {
        return { items: state.items.filter((i) => i.id !== action.id) };
      }
      return {
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: action.quantity } : i
        ),
      };
    case "CLEAR":
      return { items: [] };
    case "LOAD":
      return action.payload;
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────
type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;  // used for the navbar badge
  totalCents: number;  // used for checkout total
};

const CartContext = createContext<CartContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────
// Wrap your app with this so every page can access the cart
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // On first mount: load cart from localStorage (so it survives refresh)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ballow-cart");
      if (saved) dispatch({ type: "LOAD", payload: JSON.parse(saved) });
    } catch {
      // If localStorage is unavailable, start with empty cart
    }
  }, []);

  // Whenever cart changes: save it to localStorage
  useEffect(() => {
    localStorage.setItem("ballow-cart", JSON.stringify(state));
  }, [state]);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalCents = state.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addItem: (item) => dispatch({ type: "ADD", item }),
        removeItem: (id) => dispatch({ type: "REMOVE", id }),
        updateQty: (id, quantity) =>
          dispatch({ type: "UPDATE_QTY", id, quantity }),
        clearCart: () => dispatch({ type: "CLEAR" }),
        totalItems,
        totalCents,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────
// Any component can call useCart() to read/update the cart
export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
