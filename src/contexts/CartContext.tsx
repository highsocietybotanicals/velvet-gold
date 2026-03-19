import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Product } from "@/data/products";
import { calculateItemPrice, calculateAccessoryPrice } from "@/lib/pricing";
import { useProducts } from "@/hooks/useProducts";

// Define Accessory interface locally to avoid circular dependency
export interface Accessory {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: "pochon" | "accessoire";
}

export interface CartItem {
  product: Product;
  weight: number; // Weight in grams
}

export interface AccessoryCartItem {
  accessory: Accessory;
  quantity: number;
}

export interface SampleItem {
  product: Product;
  weight: 1; // Always 1g
}

interface CartContextType {
  items: CartItem[];
  accessoryItems: AccessoryCartItem[];
  sampleItems: SampleItem[];
  addToCart: (product: Product, weight: number) => void;
  addAccessory: (accessory: Accessory, quantity: number) => void;
  addSample: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  removeAccessory: (accessoryId: string) => void;
  removeSample: (productId: string) => void;
  updateWeight: (productId: string, weight: number) => void;
  updateAccessoryQuantity: (accessoryId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalFlowerWeight: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  promoDiscount: number; // percentage e.g. 15
  setPromoDiscount: (discount: number) => void;
  freeShipping: boolean;
  setFreeShipping: (free: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Safe localStorage parsing
const safeParseJSON = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { prices: dbProducts } = useProducts();
  const [items, setItems] = useState<CartItem[]>(() => safeParseJSON("cart", []));
  const [accessoryItems, setAccessoryItems] = useState<AccessoryCartItem[]>(() => 
    safeParseJSON("cart-accessories", [])
  );
  const [sampleItems, setSampleItems] = useState<SampleItem[]>(() => 
    safeParseJSON("cart-samples", [])
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);

  // Sync cart prices with database prices
  useEffect(() => {
    if (!dbProducts || dbProducts.length === 0) return;
    
    setItems(prev => {
      const updated = prev.map(item => {
        const dbProduct = dbProducts.find(p => p.id === item.product.id);
        if (dbProduct && dbProduct.price !== item.product.price) {
          return { ...item, product: { ...item.product, price: dbProduct.price } };
        }
        return item;
      });
      return updated.some((item, i) => item !== prev[i]) ? updated : prev;
    });

    setSampleItems(prev => {
      const updated = prev.map(item => {
        const dbProduct = dbProducts.find(p => p.id === item.product.id);
        if (dbProduct && dbProduct.price !== item.product.price) {
          return { ...item, product: { ...item.product, price: dbProduct.price } };
        }
        return item;
      });
      return updated.some((item, i) => item !== prev[i]) ? updated : prev;
    });
  }, [dbProducts]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("cart-accessories", JSON.stringify(accessoryItems));
  }, [accessoryItems]);

  useEffect(() => {
    localStorage.setItem("cart-samples", JSON.stringify(sampleItems));
  }, [sampleItems]);

  // Auto-adjust samples when flower weight changes
  useEffect(() => {
    const currentWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const allowedSamples = Math.floor(currentWeight / 10);
    
    // If we have more samples than allowed, remove excess
    if (sampleItems.length > allowedSamples) {
      setSampleItems(prev => prev.slice(0, allowedSamples));
    }
  }, [items, sampleItems.length]);

  const withLatestDbPrice = (product: Product): Product => {
    const dbProduct = dbProducts.find(p => p.id === product.id);
    return dbProduct ? { ...product, price: dbProduct.price } : product;
  };

  const addToCart = (product: Product, weight: number) => {
    const pricedProduct = withLatestDbPrice(product);
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === pricedProduct.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === pricedProduct.id
            ? { ...item, weight: item.weight + weight, product: pricedProduct }
            : item
        );
      }
      return [...prev, { product: pricedProduct, weight }];
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

  const addSample = (product: Product) => {
    const currentWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const allowedSamples = Math.floor(currentWeight / 10);
    
    if (sampleItems.length >= allowedSamples) return;
    
    const alreadyExists = sampleItems.some(item => item.product.id === product.id);
    if (alreadyExists) return;
    
    const pricedProduct = withLatestDbPrice(product);
    setSampleItems((prev) => [...prev, { product: pricedProduct, weight: 1 }]);
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const removeAccessory = (accessoryId: string) => {
    setAccessoryItems((prev) => prev.filter((item) => item.accessory.id !== accessoryId));
  };

  const removeSample = (productId: string) => {
    setSampleItems((prev) => prev.filter((item) => item.product.id !== productId));
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
    setSampleItems([]);
    setPromoCode("");
    setPromoDiscount(0);
  };

  const totalItems = items.length + accessoryItems.length + sampleItems.length;
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
    // Sample items are FREE (0€)

  return (
    <CartContext.Provider
      value={{
        items,
        accessoryItems,
        sampleItems,
        addToCart,
        addAccessory,
        addSample,
        removeFromCart,
        removeAccessory,
        removeSample,
        updateWeight,
        updateAccessoryQuantity,
        clearCart,
        totalItems,
        totalFlowerWeight,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
        promoCode,
        setPromoCode,
        promoDiscount,
        setPromoDiscount,
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
