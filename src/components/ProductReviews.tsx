import { useEffect, useState } from "react";
import { Star, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

const ProductReviews = ({ productId }: { productId: string }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Review form state
  const [canReview, setCanReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      setReviews((data as Review[]) || []);
      setLoading(false);
    };
    fetchReviews();
  }, [productId]);

  // Check if user can leave a review
  useEffect(() => {
    if (!user) {
      setCanReview(false);
      return;
    }

    const checkEligibility = async () => {
      // Check if already reviewed this product
      const { data: existingReview } = await (supabase as any)
        .from("product_reviews")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .limit(1);

      if (existingReview && existingReview.length > 0) {
        setAlreadyReviewed(true);
        setCanReview(false);
        return;
      }

      // Check if user has a delivered order with this product
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "delivered");

      if (!orders || orders.length === 0) {
        setCanReview(false);
        return;
      }

      const orderIds = orders.map((o) => o.id);
      const { data: items } = await supabase
        .from("order_items")
        .select("id")
        .in("order_id", orderIds)
        .eq("product_id", productId)
        .limit(1);

      setCanReview(!!(items && items.length > 0));
    };

    checkEligibility();
  }, [user, productId]);

  const handleSubmit = async () => {
    if (!user || !comment.trim()) return;
    setSubmitting(true);

    const authorName = profile?.full_name || user.email?.split("@")[0] || "Client";

    const { error } = await supabase.from("product_reviews").insert({
      product_id: productId,
      user_id: user.id,
      author_name: authorName,
      rating,
      comment: comment.trim(),
      status: "pending",
    });

    setSubmitting(false);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de soumettre votre avis.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Avis envoyé ✅",
      description: "Votre avis est en attente de validation par notre équipe.",
    });
    setComment("");
    setAlreadyReviewed(true);
    setCanReview(false);
  };

  if (loading) return null;

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const timeAgo = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return "aujourd'hui";
    if (days === 1) return "hier";
    if (days < 7) return `il y a ${days}j`;
    if (days < 30) return `il y a ${Math.floor(days / 7)} sem.`;
    return `il y a ${Math.floor(days / 30)} mois`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-card border border-border rounded-2xl p-6 mt-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-lg text-foreground">Avis Clients</h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${s <= Math.round(avgRating) ? "text-primary fill-primary" : "text-muted-foreground/30"}`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {avgRating.toFixed(1)} ({reviews.length} avis)
            </span>
          </div>
        )}
      </div>

      {/* Review Form */}
      {canReview && (
        <div className="border border-primary/20 rounded-xl p-4 mb-6 bg-primary/5">
          <h4 className="text-sm font-medium text-foreground mb-3">Laisser un avis</h4>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
              >
                <Star
                  className={`w-6 h-6 cursor-pointer transition-colors ${
                    s <= (hoverRating || rating) ? "text-primary fill-primary" : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Partagez votre expérience avec ce produit..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            className="mb-3 bg-background"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{comment.length}/500</span>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !comment.trim()}
              size="sm"
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Envoi..." : "Envoyer"}
            </Button>
          </div>
        </div>
      )}

      {alreadyReviewed && (
        <p className="text-sm text-muted-foreground mb-6 italic">
          Vous avez déjà soumis un avis pour ce produit.
        </p>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Aucun avis pour le moment.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-t border-border/50 pt-4 first:border-0 first:pt-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">{review.author_name}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${s <= review.rating ? "text-primary fill-primary" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo(review.created_at)}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ProductReviews;
