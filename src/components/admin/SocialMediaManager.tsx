import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { allProducts } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  Layers,
  ChevronDown,
  ChevronUp,
  Paintbrush,
  Undo2,
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
  series_id: string | null;
  series_position: number | null;
  post_type: string | null;
}

interface Series {
  id: string;
  name: string;
  posts: SocialPost[];
  createdAt: string;
}

const POST_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  teasing: { label: "🔮 Teasing", color: "bg-purple-500/20 text-purple-300" },
  product: { label: "💎 Produit", color: "bg-amber-500/20 text-amber-300" },
  education: { label: "🧠 Éducation", color: "bg-blue-500/20 text-blue-300" },
  lifestyle: { label: "✨ Lifestyle", color: "bg-pink-500/20 text-pink-300" },
  conseil: { label: "💡 Conseil", color: "bg-green-500/20 text-green-300" },
  cta: { label: "🎯 CTA", color: "bg-red-500/20 text-red-300" },
};

const SocialMediaManager = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [customTheme, setCustomTheme] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [editingCaption, setEditingCaption] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});

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

  // Group posts by series
  const { series, standalonePosts } = useMemo(() => {
    const seriesMap = new Map<string, SocialPost[]>();
    const standalone: SocialPost[] = [];

    for (const post of posts) {
      if (post.series_id) {
        const existing = seriesMap.get(post.series_id) || [];
        existing.push(post);
        seriesMap.set(post.series_id, existing);
      } else {
        standalone.push(post);
      }
    }

    const seriesList: Series[] = Array.from(seriesMap.entries()).map(([id, seriesPosts]) => ({
      id,
      name: seriesPosts[0]?.theme || "Série sans nom",
      posts: seriesPosts.sort((a, b) => (a.series_position || 0) - (b.series_position || 0)),
      createdAt: seriesPosts[0]?.created_at || "",
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { series: seriesList, standalonePosts: standalone };
  }, [posts]);

  const getProductImageUrl = (productId: string): string | null => {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return null;
    // Product images are imported assets — build absolute URL
    return product.image;
  };

  const handleGenerateSeries = async () => {
    setGenerating(true);
    try {
      const productsData = allProducts.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        cbdPercentage: p.cbdPercentage,
        mood: p.mood,
        terpenes: p.terpenes,
        imageUrl: `${window.location.origin}${p.image}`,
      }));

      const { data, error } = await supabase.functions.invoke("social-content", {
        body: {
          action: "generate-series",
          products: productsData,
          theme: customTheme || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Série "${data.seriesName}" générée — ${data.posts.length} posts !`);
      setCustomTheme("");
      // Auto-expand the new series
      if (data.seriesId) {
        setExpandedSeries(prev => ({ ...prev, [data.seriesId]: true }));
      }
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
      if (editingCaption[postId]) {
        await supabase
          .from("social_posts")
          .update({ caption: editingCaption[postId] })
          .eq("id", postId);
      }

      const { data, error } = await supabase.functions.invoke("social-content", {
        body: { action: "publish-telegram", postId, chatId: telegramChatId },
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

  const handlePublishSeriesTelegram = async (seriesPosts: SocialPost[]) => {
    if (!telegramChatId) {
      toast.error("Entre l'ID du canal Telegram");
      return;
    }

    const drafts = seriesPosts.filter(p => p.status === "draft");
    for (const post of drafts) {
      await handlePublishTelegram(post.id);
      // Small delay between posts
      await new Promise(r => setTimeout(r, 2000));
    }
  };

  const handleCopyCaption = (post: SocialPost) => {
    const text = editingCaption[post.id] || post.caption || "";
    navigator.clipboard.writeText(text);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Légende copiée !");
  };

  const handleDownloadImage = async (post: SocialPost) => {
    const imageUrl = post.image_url || (post.product_id ? getProductImageUrl(post.product_id) : null);
    if (!imageUrl) return;

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

  const toggleSeries = (seriesId: string) => {
    setExpandedSeries(prev => ({ ...prev, [seriesId]: !prev[seriesId] }));
  };

  const renderPostCard = (post: SocialPost, compact = false) => {
    const imageUrl = post.image_url || (post.product_id ? getProductImageUrl(post.product_id) : null);
    const productName = post.product_id ? allProducts.find(p => p.id === post.product_id)?.name : null;
    const typeInfo = post.post_type ? POST_TYPE_LABELS[post.post_type] : null;

    return (
      <div key={post.id} className={`border border-border/30 rounded-lg overflow-hidden ${compact ? '' : ''}`}>
        <div className="grid md:grid-cols-[200px_1fr] gap-0">
          {/* Image */}
          {imageUrl ? (
            <div className="aspect-square md:aspect-auto bg-black flex items-center justify-center overflow-hidden">
              <img src={imageUrl} alt={productName || "Post"} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-square md:aspect-auto bg-muted/30 flex flex-col items-center justify-center gap-1 min-h-[120px]">
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              {typeInfo && <span className="text-xs text-muted-foreground">{typeInfo.label}</span>}
            </div>
          )}

          {/* Content */}
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {post.series_position && (
                <span className="text-xs font-mono text-muted-foreground">#{post.series_position}</span>
              )}
              {typeInfo && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.color}`}>{typeInfo.label}</span>
              )}
              {productName && (
                <Badge variant="outline" className="text-xs">{productName}</Badge>
              )}
              <Badge variant={post.status === "published" ? "default" : "secondary"} className="text-xs">
                {post.status === "published" ? "✅ Publié" : "📝 Brouillon"}
              </Badge>
              {post.published_to?.map(p => (
                <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
              ))}
            </div>

            <Textarea
              value={editingCaption[post.id] ?? post.caption ?? ""}
              onChange={(e) => setEditingCaption({ ...editingCaption, [post.id]: e.target.value })}
              className="min-h-[80px] text-sm bg-background/50"
              placeholder="Légende..."
            />

            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleCopyCaption(post)}>
                {copiedId === post.id ? <><Check className="h-3 w-3 mr-1" />Copié</> : <><Copy className="h-3 w-3 mr-1" />Copier</>}
              </Button>
              {imageUrl && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleDownloadImage(post)}>
                  <Download className="h-3 w-3 mr-1" />Instagram
                </Button>
              )}
              {post.status !== "published" && (
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handlePublishTelegram(post.id)}
                  disabled={publishing === post.id || !telegramChatId}
                >
                  {publishing === post.id ? (
                    <><Loader2 className="h-3 w-3 animate-spin mr-1" />Envoi...</>
                  ) : (
                    <><Send className="h-3 w-3 mr-1" />Telegram</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-gold/20 mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold" />
          Social Media — Directrice de Communication IA
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          L'IA planifie des séries stratégiques avec vos vraies photos produits. Chaque série suit un arc narratif milliméré.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Series Generation */}
        <div className="border border-gold/20 rounded-lg p-4 space-y-3 bg-gold/5">
          <h3 className="font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4 text-gold" />
            Planifier une nouvelle série
          </h3>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              placeholder="Thème (optionnel) : ex. 'Rentrée luxe', 'Nuits d'été', ou laisser vide pour laisser l'IA décider"
              value={customTheme}
              onChange={(e) => setCustomTheme(e.target.value)}
            />
            <Button onClick={handleGenerateSeries} disabled={generating}>
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Planification en cours...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />Générer une série (5-7 posts)</>
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

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gold" />
          </div>
        ) : series.length === 0 && standalonePosts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucune série planifiée. Commence par en générer une !
          </p>
        ) : (
          <div className="space-y-6">
            {/* Series */}
            {series.map((s) => {
              const isExpanded = expandedSeries[s.id] ?? false;
              const publishedCount = s.posts.filter(p => p.status === "published").length;
              const totalCount = s.posts.length;

              return (
                <Card key={s.id} className="border-border/50">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/10 transition-colors"
                    onClick={() => toggleSeries(s.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="h-4 w-4 text-gold" />
                      <div>
                        <h4 className="font-semibold text-sm">{s.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {totalCount} posts · {publishedCount}/{totalCount} publiés · {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {publishedCount < totalCount && telegramChatId && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={(e) => { e.stopPropagation(); handlePublishSeriesTelegram(s.posts); }}
                        >
                          <Send className="h-3 w-3 mr-1" />Publier tout
                        </Button>
                      )}
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                      {s.posts.map(post => renderPostCard(post, true))}
                    </div>
                  )}
                </Card>
              );
            })}

            {/* Standalone posts (legacy) */}
            {standalonePosts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">Posts individuels</h4>
                {standalonePosts.map(post => renderPostCard(post))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialMediaManager;
