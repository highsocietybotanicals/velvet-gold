import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useMyRep, useCommissions } from "@/hooks/useCommercial";

const euro = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

const monthLabel = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

const CommercialCommissionsPage = () => {
  const { data: rep } = useMyRep();
  const { commissions, isLoading } = useCommissions(rep?.id);

  const totals = useMemo(() => {
    const paid = commissions.filter((c) => c.status === "paid");
    const pending = commissions.filter((c) => c.status !== "paid");
    return {
      revenue: commissions.reduce((s, c) => s + Number(c.revenue_ht), 0),
      paid: paid.reduce((s, c) => s + Number(c.commission_amount), 0),
      pending: pending.reduce((s, c) => s + Number(c.commission_amount), 0),
    };
  }, [commissions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gold-text">Mes commissions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {rep
            ? `${Number(rep.commission_percent)} % du chiffre d'affaires HT généré par tes partenaires.`
            : "Aucune fiche commerciale rattachée à ce compte."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">CA HT apporté</p>
            <p className="text-xl font-semibold">{euro(totals.revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Commissions à percevoir</p>
            <p className="text-xl font-semibold text-amber-300">{euro(totals.pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Commissions versées</p>
            <p className="text-xl font-semibold text-emerald-400">{euro(totals.paid)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détail</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          ) : commissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune commission enregistrée pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2">Période</th>
                    <th className="text-left py-2">Client</th>
                    <th className="text-right py-2">CA HT</th>
                    <th className="text-right py-2">Taux</th>
                    <th className="text-right py-2">Commission</th>
                    <th className="text-right py-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-b border-border/30 last:border-0">
                      <td className="py-2 capitalize">{monthLabel(c.period_month)}</td>
                      <td className="py-2">{c.client_label}</td>
                      <td className="py-2 text-right">{euro(Number(c.revenue_ht))}</td>
                      <td className="py-2 text-right">{Number(c.commission_percent)} %</td>
                      <td className="py-2 text-right font-medium">
                        {euro(Number(c.commission_amount))}
                      </td>
                      <td className="py-2 text-right">
                        <Badge
                          className={
                            c.status === "paid"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-amber-500/15 text-amber-300"
                          }
                        >
                          {c.status === "paid" ? "Versée" : "En attente"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommercialCommissionsPage;
