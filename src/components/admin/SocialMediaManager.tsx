import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { allProducts } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Sparkles,
  Send,
  Download,
  Copy,
  Loader2,
  Image as ImageIcon,
  MessageSquare,
  Check,
} from "lucide-react";

interface SocialPost {
  id: string;
  product_id: string | null;
  theme: string | null;
  image_url: string | null;
  caption: string | null;
  status: string;
  published_to: string[];
  created_at: string;
  published_at: string | null;
}

const SocialMediaManager = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [customTheme, setCustomTheme] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [editingCaption, setEditingCaption] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("social_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data as unknown as SocialPost[]);
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    const product = allProducts.find((p) => p.id === selectedProduct);
    if (!product && !customTheme) {
      toast.error("Choisis un produit ou entre un thème personnalisé");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("social-content", {
        body: {
          action: "generate",
          productName: product?.name,
          productDescription: product?.description,
          theme: customTheme || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Post généré avec succès !");
      fetchPosts();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const handlePublishTelegram = async (postId: string) => {
    if (!telegramChatId) {
      toast.error("Entre l'ID du canal Telegram");
      return;
    }

    setPublishing(postId);
    try {
      // Update caption first if edited
      if (editingCaption[postId]) {
        await supabase
          .from("social_posts")
          .update({ caption: editingCaption[postId] })
          .eq("id", postId);
      }

      const { data, error } = await supabase.functions.invoke("social-content", {
        body: {
          action: "publish-telegram",
          postId,
          chatId: telegramChatId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Publié sur Telegram !");
      fetchPosts();
    } catch (e: any) {
      toast.error(e.message || "Erreur publication Telegram");
    } finally {
      setPublishing(null);
    }
  };

  const handleCopyCaption = (post: SocialPost) => {
    const text = editingCaption[post.id] || post.caption || "";
    navigator.clipboard.writeText(text);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Légende copiée !");
  };

  const handleDownloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hsb-post-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Image téléchargée !");
    } catch {
      toast.error("Erreur de téléchargement");
    }
  };

  return (
    <Card className="border-gold/20 mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold" />
          Social Media — Génération IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generation controls */}
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Produit</label>
            <Select value={selectedProduct} onValueChange={(v) => { setSelectedProduct(v); setCustomTheme(""); }}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un produit..." />
              </SelectTrigger>
              <SelectContent>
                {allProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">ou Thème libre</label>
            <Input
              placeholder="Ex: lifestyle nocturne, relaxation..."
              value={customTheme}
              onChange={(e) => { setCustomTheme(e.target.value); setSelectedProduct(""); }}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleGenerate} disabled={generating} className="w-full md:w-auto">
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Génération...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />Générer</>
              )}
            </Button>
          </div>
        </div>

        {/* Telegram Chat ID */}
        <div className="flex items-center gap-3">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ID du canal Telegram (ex: @monchannel ou -100123456)"
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Posts list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gold" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucun post généré. Commence par en créer un !
          </p>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <Card key={post.id} className="border-border/50 overflow-hidden">
                <div className="grid md:grid-cols-[300px_1fr] gap-0">
                  {/* Image */}
                  {post.image_url ? (
                    <div className="aspect-square md:aspect-auto bg-black flex items-center justify-center overflow-hidden">
                      <img
                        src={post.image_url}
                        alt="Post social"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square md:aspect-auto bg-muted flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={post.status === "published" ? "default" : "secondary"}>
                          {post.status === "published" ? "Publié" : "Brouillon"}
                        </Badge>
                        {post.published_to?.map((p) => (
                          <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>

                    <Textarea
                      value={editingCaption[post.id] ?? post.caption ?? ""}
                      onChange={(e) => setEditingCaption({ ...editingCaption, [post.id]: e.target.value })}
                      className="min-h-[120px] text-sm"
                      placeholder="Légende..."
                    />

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyCaption(post)}
                      >
                        {copiedId === post.id ? (
                          <><Check className="h-3 w-3 mr-1" />Copié</>
                        ) : (
                          <><Copy className="h-3 w-3 mr-1" />Copier légende</>
                        )}
                      </Button>

                      {post.image_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadImage(post.image_url!)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Instagram
                        </Button>
                      )}

                      <Button
                        size="sm"
                        onClick={() => handlePublishTelegram(post.id)}
                        disabled={publishing === post.id || !telegramChatId}
                      >
                        {publishing === post.id ? (
                          <><Loader2 className="h-3 w-3 animate-spin mr-1" />Envoi...</>
                        ) : (
                          <><Send className="h-3 w-3 mr-1" />Telegram</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialMediaManager;
