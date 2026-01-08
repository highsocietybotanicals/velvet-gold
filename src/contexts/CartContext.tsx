import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Product } from "@/data/products";
import { calculateItemPrice } from "@/lib/pricing";

export interface CartItem {
  product: Product;
  weight: number; // Weight in grams
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, weight: number) => void;
  removeFromCart: (productId: string) => void;
  updateWeight: (productId: string, weight: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalWeight: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, weight: number) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, weight: item.weight + weight }
            : item
        );
      }
      return [...prev, { product, weight }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateWeight = (productId: string, weight: number) => {
    if (weight <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, weight } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.length;
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const totalPrice = items.reduce((sum, item) => {
    const { finalPrice } = calculateItemPrice(item.product.price, item.weight);
    return sum + finalPrice;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateWeight,
        clearCart,
        totalItems,
        totalWeight,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
