import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, Loader2, ShoppingCart } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useCart } from "@/contexts/CartContext";
import { allProducts } from "@/data/products";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Message = { role: "user" | "assistant"; content: string };

interface CartCommand {
  productId: string;
  weight: number;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sommelier-chat`;

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Bienvenue chez **High Society Botanicals** ✨\n\nJe suis votre Sommelier personnel. Dis-moi ce que tu recherches — détente, énergie, sommeil ou créativité — et je te guiderai vers la variété parfaite !",
};

const ADD_TO_CART_REGEX = /\[ADD_TO_CART:\s*(\{[^}]+\})\s*\]/g;

function parseCartCommands(content: string): { cleanContent: string; commands: CartCommand[] } {
  const commands: CartCommand[] = [];
  const cleanContent = content.replace(ADD_TO_CART_REGEX, (_, json) => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.productId && parsed.weight > 0) {
        commands.push({ productId: parsed.productId, weight: parsed.weight });
      }
    } catch {}
    return "";
  }).trim();
  return { cleanContent, commands };
}

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    onError("Connectez-vous pour utiliser le Sommelier.");
    return;
  }

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    onError(data.error || "Une erreur est survenue");
    return;
  }

  if (!resp.body) {
    onError("Pas de réponse");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        onDone();
        return;
      }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

function CartButton({ command }: { command: CartCommand }) {
  const { addToCart } = useCart();
  const product = allProducts.find((p) => p.id === command.productId);

  if (!product) return null;

  const handleClick = () => {
    addToCart(product, command.weight);
    toast({
      title: "Ajouté au panier 🛒",
      description: `${product.name} — ${command.weight}g`,
    });
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary text-xs font-medium transition-colors border border-primary/30"
    >
      <ShoppingCart className="w-3.5 h-3.5" />
      Ajouter {product.name} ({command.weight}g)
    </button>
  );
}

const SommelierChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    const historyForAPI = newMessages.filter((m) => m !== WELCOME_MESSAGE);

    await streamChat({
      messages: historyForAPI,
      onDelta: (chunk) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last !== WELCOME_MESSAGE) {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      },
      onDone: () => setIsLoading(false),
      onError: (msg) => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ ${msg}` },
        ]);
        setIsLoading(false);
      },
    });
  };

  const renderMessage = (msg: Message) => {
    if (msg.role === "user") return msg.content;

    const { cleanContent, commands } = parseCartCommands(msg.content);

    return (
      <>
        <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>p+p]:mt-2 [&>ul]:mt-1 [&>ul]:mb-0">
          <ReactMarkdown>{cleanContent}</ReactMarkdown>
        </div>
        {commands.length > 0 && (
          <div className="flex flex-col gap-1 mt-2">
            {commands.map((cmd, i) => (
              <CartButton key={`${cmd.productId}-${i}`} command={cmd} />
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
            aria-label="Ouvrir le sommelier"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-4rem)] flex flex-col rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-display text-sm text-foreground">Le Sommelier</p>
                  <p className="text-xs text-muted-foreground">Conseil personnalisé</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {renderMessage(msg)}
                  </div>
                </motion.div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-border/50 bg-card">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Posez votre question..."
                  disabled={isLoading}
                  className="flex-1 bg-muted border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors"
                  aria-label="Envoyer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SommelierChatbot;
