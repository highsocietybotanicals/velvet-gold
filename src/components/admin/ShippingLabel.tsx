import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Package, Loader2, ExternalLink, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ShippingLabelProps {
  order: {
    id: string;
    display_order_number?: string | null;
    order_number: number;
    tracking_number?: string | null;
    tracking_url?: string | null;
    delivery_type: string;
  };
}

const ShippingLabel = ({ order }: ShippingLabelProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (order.delivery_type !== "postal") return null;

  const handleGenerateLabel = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-colissimo-label",
        { body: { orderId: order.id } }
      );

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Erreur Colissimo",
          description: data.details || data.error,
          variant: "destructive",
        });
        return;
      }

      // Open PDF in new tab
      if (data?.pdfBase64) {
        const blob = new Blob(
          [Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0))],
          { type: "application/pdf" }
        );
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }

      toast({
        title: data?.alreadyGenerated
          ? "Étiquette existante"
          : "Étiquette Colissimo générée ✅",
        description: `N° de suivi : ${data?.trackingNumber}`,
      });

      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    } catch (err: any) {
      console.error("Colissimo error:", err);
      toast({
        title: "Erreur",
        description: "Impossible de générer l'étiquette Colissimo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (order.tracking_number) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">
          {order.tracking_number}
        </span>
        <a
          href={order.tracking_url || `https://www.laposte.fr/outils/suivre-vos-envois?code=${order.tracking_number}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-primary">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </a>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground"
          onClick={handleGenerateLabel}
          disabled={loading}
          title="Réimprimer l'étiquette"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerateLabel}
      disabled={loading}
      className="border-primary/30 text-primary hover:bg-primary/10"
      title="Générer étiquette Colissimo"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Package className="h-4 w-4 mr-1" />
          Colissimo
        </>
      )}
    </Button>
  );
};

export default ShippingLabel;
