import { useState } from "react";
import { motion } from "framer-motion";
import { Tag, Plus, Trash2, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const PromoCodeManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { data: promoCodes = [], isLoading } = useQuery({
    queryKey: ["promo-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleCreate = async () => {
    if (!newCode.trim() || !newDiscount) {
      toast({ title: "Erreur", description: "Code et réduction obligatoires.", variant: "destructive" });
      return;
    }
    const discount = parseFloat(newDiscount);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      toast({ title: "Erreur", description: "Réduction entre 1% et 100%.", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.from("promo_codes").insert({
        code: newCode.trim().toUpperCase(),
        discount_percent: discount,
        max_uses: newMaxUses ? parseInt(newMaxUses) : null,
        expires_at: newExpiry || null,
      } as any);
      if (error) throw error;
      toast({ title: "Code créé ✅", description: `${newCode.toUpperCase()} — ${discount}%` });
      setNewCode("");
      setNewDiscount("");
      setNewMaxUses("");
      setNewExpiry("");
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Impossible de créer le code.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active: !currentlyActive } as any)
        .eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
    } catch {
      toast({ title: "Erreur", description: "Impossible de modifier le statut.", variant: "destructive" });
    }
  };

  const deleteCode = async (id: string) => {
    try {
      const { error } = await supabase.from("promo_codes").delete().eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      toast({ title: "Supprimé ✅" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" });
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.14 }}
      className="mb-12"
    >
      <Card className="border-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-gold" />
            Codes Promo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Code *</label>
              <Input
                value={newCode}
                onChange={e => setNewCode(e.target.value.toUpperCase())}
                placeholder="EX: BIENVENUE20"
                className="uppercase"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Réduction % *</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={newDiscount}
                onChange={e => setNewDiscount(e.target.value)}
                placeholder="15"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Max utilisations</label>
              <Input
                type="number"
                min="1"
                value={newMaxUses}
                onChange={e => setNewMaxUses(e.target.value)}
                placeholder="Illimité"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Expire le</label>
              <Input
                type="date"
                value={newExpiry}
                onChange={e => setNewExpiry(e.target.value)}
              />
            </div>
            <Button onClick={handleCreate} disabled={isCreating} className="gap-2">
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Créer
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
          ) : promoCodes.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">Aucun code promo</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Réduction</TableHead>
                    <TableHead>Utilisations</TableHead>
                    <TableHead>Expire</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.map((code: any) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono font-semibold text-primary">
                        {code.code}
                      </TableCell>
                      <TableCell className="font-semibold text-gold">
                        -{code.discount_percent}%
                      </TableCell>
                      <TableCell>
                        {code.current_uses}{code.max_uses ? `/${code.max_uses}` : " / ∞"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {code.expires_at
                          ? format(new Date(code.expires_at), "dd/MM/yyyy", { locale: fr })
                          : "Jamais"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={code.is_active ? "default" : "secondary"}
                          className={code.is_active ? "bg-green-600/20 text-green-500" : ""}
                        >
                          {code.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(code.id, code.is_active)}
                            title={code.is_active ? "Désactiver" : "Activer"}
                          >
                            {code.is_active ? (
                              <ToggleRight className="h-4 w-4 text-green-500" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCode(code.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.section>
  );
};

export default PromoCodeManager;
