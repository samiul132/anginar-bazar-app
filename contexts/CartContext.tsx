import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface CartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  slug: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (product_id: number) => void;
  updateQuantity: (product_id: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  isInCart: (product_id: number) => boolean;
  getItemQuantity: (product_id: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    if (loaded) {
      // Debounce save - wait 500ms after last change
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveCart();
      }, 500);
    }

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [cartItems, loaded]);

  const loadCart = async () => {
    try {
      const cartData = await AsyncStorage.getItem("cart");
      if (cartData) {
        setCartItems(JSON.parse(cartData));
      }
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      setLoaded(true);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem("cart", JSON.stringify(cartItems));
    } catch (error) {
      console.error("Error saving cart:", error);
    }
  };

  const addToCart = (
    item: Omit<CartItem, "quantity">,
    quantity: number = 1,
  ) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (i) => i.product_id === item.product_id,
      );
      if (existingItem) {
        return prevItems.map((i) =>
          i.product_id === item.product_id
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      }
      return [...prevItems, { ...item, quantity }];
    });
  };

  const removeFromCart = (product_id: number) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product_id !== product_id),
    );
  };

  const updateQuantity = (product_id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(product_id);
    } else {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.product_id === product_id ? { ...item, quantity } : item,
        ),
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const isInCart = (product_id: number) => {
    return cartItems.some((item) => item.product_id === product_id);
  };

  const getItemQuantity = (product_id: number) => {
    const item = cartItems.find((item) => item.product_id === product_id);
    return item ? item.quantity : 0;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        isInCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
