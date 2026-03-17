import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

export interface CartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  slug: string;
}

interface CartActions {
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (product_id: number) => void;
  updateQuantity: (product_id: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  isInCart: (product_id: number) => boolean;
  getItemQuantity: (product_id: number) => number;
}

// ── ৩টা আলাদা context ──
// 1. CartItemsContext   — array (cart page, header badge)
// 2. CartMapContext     — Map<id, quantity> (ProductCard O(1) lookup)
// 3. CartActionsContext — stable actions (কখনো re-render করে না)
const CartItemsContext = createContext<CartItem[]>([]);
const CartMapContext = createContext<Map<number, number>>(new Map());
const CartActionsContext = createContext<CartActions | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // ── Map: product_id → quantity (O(1) lookup, array find() এর বদলে) ──
  const cartMap = useMemo(() => {
    const map = new Map<number, number>();
    cartItems.forEach((item) => map.set(item.product_id, item.quantity));
    return map;
  }, [cartItems]);

  const cartItemsRef = useRef<CartItem[]>([]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  // ── Load ──
  useEffect(() => {
    const loadCart = async () => {
      try {
        const cartData = await AsyncStorage.getItem("cart");
        if (cartData) setCartItems(JSON.parse(cartData));
      } catch (error) {
        console.error("Error loading cart:", error);
      } finally {
        setLoaded(true);
      }
    };
    loadCart();
  }, []);

  // ── Debounced save ──
  useEffect(() => {
    if (!loaded) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      AsyncStorage.setItem("cart", JSON.stringify(cartItemsRef.current)).catch(
        (err) => console.error("Error saving cart:", err),
      );
    }, 500);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [cartItems, loaded]);

  // ── App background এ immediate save ──
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        AsyncStorage.setItem(
          "cart",
          JSON.stringify(cartItemsRef.current),
        ).catch(console.error);
      }
    });
    return () => subscription.remove();
  }, []);

  // ── Stable actions — dependency নেই ──
  const addToCart = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setCartItems((prev) => {
        const idx = prev.findIndex((i) => i.product_id === item.product_id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
          return next;
        }
        return [...prev, { ...item, quantity }];
      });
    },
    [],
  );

  const removeFromCart = useCallback((product_id: number) => {
    setCartItems((prev) =>
      prev.filter((item) => item.product_id !== product_id),
    );
  }, []);

  const updateQuantity = useCallback((product_id: number, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) =>
        prev.filter((item) => item.product_id !== product_id),
      );
    } else {
      setCartItems((prev) => {
        const idx = prev.findIndex((i) => i.product_id === product_id);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], quantity };
        return next;
      });
    }
  }, []);

  const actions = useMemo<CartActions>(
    () => ({
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart: () => setCartItems([]),
      getCartTotal: () =>
        cartItemsRef.current.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        ),
      getCartCount: () =>
        cartItemsRef.current.reduce((sum, item) => sum + item.quantity, 0),
      isInCart: (id: number) =>
        cartItemsRef.current.some((item) => item.product_id === id),
      getItemQuantity: (id: number) =>
        cartItemsRef.current.find((item) => item.product_id === id)?.quantity ??
        0,
    }),
    [addToCart, removeFromCart, updateQuantity],
  );

  return (
    <CartItemsContext.Provider value={cartItems}>
      <CartMapContext.Provider value={cartMap}>
        <CartActionsContext.Provider value={actions}>
          {children}
        </CartActionsContext.Provider>
      </CartMapContext.Provider>
    </CartItemsContext.Provider>
  );
}

// ── Hooks ──

/** Cart array — cart page, header badge, checkout */
export const useCartItems = () => useContext(CartItemsContext);

/**
 * ProductCard এর জন্য — O(1) quantity lookup
 * পুরো array তে .find() এর বদলে Map থেকে সরাসরি
 */
export const useProductQuantity = (product_id: number): number => {
  const map = useContext(CartMapContext);
  return map.get(product_id) ?? 0;
};

/** Actions — কখনো re-render trigger করে না */
export const useCartActions = () => {
  const ctx = useContext(CartActionsContext);
  if (!ctx) throw new Error("useCartActions must be used within CartProvider");
  return ctx;
};

/** Backward compatible — cart page, checkout এ ব্যবহার করুন */
export function useCart() {
  const cartItems = useCartItems();
  const actions = useCartActions();
  return { cartItems, ...actions };
}
