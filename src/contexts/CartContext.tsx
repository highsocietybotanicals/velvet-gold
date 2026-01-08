import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Product } from "@/data/products";
import { Accessory } from "@/data/accessories";
import { calculateItemPrice, calculateAccessoryPrice } from "@/lib/pricing";

export interface CartItem {
  product: Product;
  weight: number; // Weight in grams
}

export interface AccessoryCartItem {
  accessory: Accessory;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  accessoryItems: AccessoryCartItem[];
  addToCart: (product: Product, weight: number) => void;
  addAccessory: (accessory: Accessory, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  removeAccessory: (accessoryId: string) => void;
  updateWeight: (productId: string, weight: number) => void;
  updateAccessoryQuantity: (accessoryId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalFlowerWeight: number;
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

  const [accessoryItems, setAccessoryItems] = useState<AccessoryCartItem[]>(() => {
    const saved = localStorage.getItem("cart-accessories");
    return saved ? JSON.parse(saved) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("cart-accessories", JSON.stringify(accessoryItems));
  }, [accessoryItems]);

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

  const addAccessory = (accessory: Accessory, quantity: number) => {
    setAccessoryItems((prev) => {
      const existing = prev.find((item) => item.accessory.id === accessory.id);
      if (existing) {
        return prev.map((item) =>
          item.accessory.id === accessory.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { accessory, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const removeAccessory = (accessoryId: string) => {
    setAccessoryItems((prev) => prev.filter((item) => item.accessory.id !== accessoryId));
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

  const updateAccessoryQuantity = (accessoryId: string, quantity: number) => {
    if (quantity <= 0) {
      removeAccessory(accessoryId);
      return;
    }
    setAccessoryItems((prev) =>
      prev.map((item) =>
        item.accessory.id === accessoryId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setAccessoryItems([]);
  };

  const totalItems = items.length + accessoryItems.length;
  const totalFlowerWeight = items.reduce((sum, item) => sum + item.weight, 0);
  
  const totalPrice = 
    // Flower prices
    items.reduce((sum, item) => {
      const { finalPrice } = calculateItemPrice(item.product.price, item.weight);
      return sum + finalPrice;
    }, 0) +
    // Accessory prices
    accessoryItems.reduce((sum, item) => {
      const { finalTotal } = calculateAccessoryPrice(item.accessory.price, item.quantity);
      return sum + finalTotal;
    }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        accessoryItems,
        addToCart,
        addAccessory,
        removeFromCart,
        removeAccessory,
        updateWeight,
        updateAccessoryQuantity,
        clearCart,
        totalItems,
        totalFlowerWeight,
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
