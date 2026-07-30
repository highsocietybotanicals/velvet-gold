import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from "react";
import type { ProCartLine } from "@/lib/proPricing";

interface ProCartContextType {
  lines: ProCartLine[];
  setUnits: (productId: string, productName: string, format: number, units: number) => void;
  getUnits: (productId: string, format: number) => number;
  removeProduct: (productId: string) => void;
  clearProCart: () => void;
  totalUnits: number;
}

const ProCartContext = createContext<ProCartContextType | undefined>(undefined);

const STORAGE_KEY = "pro-cart";

const load = (): ProCartLine[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProCartLine[]) : [];
  } catch {
    return [];
  }
};

export const ProCartProvider = ({ children }: { children: ReactNode }) => {
  const [lines, setLines] = useState<ProCartLine[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines]);

  const setUnits = (productId: string, productName: string, format: number, units: number) => {
    const safe = Math.max(0, Math.floor(Number(units) || 0));
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === productId && l.format === format);
      if (idx === -1) {
        if (safe === 0) return prev;
        return [...prev, { productId, productName, format, units: safe }];
      }
      const next = [...prev];
      if (safe === 0) next.splice(idx, 1);
      else next[idx] = { ...next[idx], units: safe, productName };
      return next;
    });
  };

  const getUnits = (productId: string, format: number) =>
    lines.find((l) => l.productId === productId && l.format === format)?.units ?? 0;

  const removeProduct = (productId: string) =>
    setLines((prev) => prev.filter((l) => l.productId !== productId));

  const clearProCart = () => setLines([]);

  const totalUnits = useMemo(() => lines.reduce((s, l) => s + l.units, 0), [lines]);

  return (
    <ProCartContext.Provider
      value={{ lines, setUnits, getUnits, removeProduct, clearProCart, totalUnits }}
    >
      {children}
    </ProCartContext.Provider>
  );
};

export const useProCart = () => {
  const ctx = useContext(ProCartContext);
  if (!ctx) throw new Error("useProCart must be used within a ProCartProvider");
  return ctx;
};
