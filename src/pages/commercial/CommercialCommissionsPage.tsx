import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp } from "lucide-react";
import {
  useMyRep,
  useCommissions,
  useCommissionTiers,
  aggregateMonthly,
  resolveTier,
  nextTier,
} from "@/hooks/useCommercial";

const euro = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

const monthLabel = (d: string) =>
  new Date(`${d.slice(0, 7)}-01T00:00:00`).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

const CommercialCommissionsPage = () => {
  const { data: rep } = useMyRep();
  const { commissions, isLoading } = useCommissions(rep?.id);
  const { tiers } = useCommissionTiers();

  const months = useMemo(() => aggregateMonthly(commissions, tiers), [commissions, tiers]);

  const currentKey = new Date().toISOString().slice(0, 7);
  const currentMonth = months.find((m) => m.month === currentKey);
  const currentRevenue = currentMonth?.revenueHT ?? 0;
  const currentTier = resolveTier(tiers, currentRevenue);
  const upcoming = nextTier(tiers, currentRevenue);

  const totals = useMemo(() => {
    const paid = commissions.filter((c) => c.status === "paid");
    return {
      revenue: commissions.reduce((s, c) => s + Number(c.revenue_ht), 0),
      paid: paid.reduce((s, c) => s + Number(c.commission_amount), 0),
      pending: commissions
        .filter((c) => c.status !== "paid")
        .reduce((s, c) => s + Number(c.commission_amount), 0),
      bonus: months.reduce((s, m) => s + m.bonus, 0),
    };
  }, [commissions, months]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gold-text">Mes commissions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {rep
            ? "Barème progressif par tranche : 10 % jusqu'à 5 000 € HT, 12 % de 5 000 à 10 000 €, 15 % au-delà. Chaque tranche ne s'applique qu'à la part de CA qu'elle couvre."
            : "Aucune fiche commerciale rattachée à ce compte."}
        </p>
      </div>

      <Card className="border-gold/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gold" /> Paliers de rémunération
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[...tiers]
              .sort((a, b) => a.min_revenue_ht - b.min_revenue_ht)
              .map((t) => (
                <Badge
                  key={t.min_revenue_ht}
                  className={
                    t.commission_percent === currentTier.commission_percent
                      ? "bg-gold/20 text-gold border border-gold/50"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {t.min_revenue_ht === 0
                    ? `Jusqu'à ${euro(
                        nextTier(tiers, 0)?.min_revenue_ht ?? 0
                      )} : ${t.commission_percent} %`
                    : `Dès ${euro(t.min_revenue_ht)} : ${t.commission_percent} %`}
                </Badge>
              ))}
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span className="capitalize">
                {monthLabel(currentKey)} · {euro(currentRevenue)} HT · taux actuel{" "}
                <strong className="text-gold">{currentTier.commission_percent} %</strong>
              </span>
              {upcoming && (
                <span>
                  encore {euro(upcoming.min_revenue_ht - currentRevenue)} pour{" "}
                  {upcoming.commission_percent} %
                </span>
              )}
            </div>
            <Progress
              value={
                upcoming
                  ? Math.min(100, (currentRevenue / upcoming.min_revenue_ht) * 100)
                  : 100
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-4">
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
            <p className="text-xs text-muted-foreground">Bonus de palier</p>
            <p className="text-xl font-semibold text-gold">{euro(totals.bonus)}</p>
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
          <CardTitle className="text-base">Récapitulatif mois par mois</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          ) : months.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune commission enregistrée pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2">Mois</th>
                    <th className="text-right py-2">CA HT</th>
                    <th className="text-right py-2">Taux moyen</th>
                    <th className="text-right py-2">Base</th>
                    <th className="text-right py-2">Bonus</th>
                    <th className="text-right py-2">Total dû</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m) => (
                    <tr key={m.month} className="border-b border-border/30 last:border-0">
                      <td className="py-2 capitalize">{monthLabel(m.month)}</td>
                      <td className="py-2 text-right">{euro(m.revenueHT)}</td>
                      <td className="py-2 text-right text-gold">{m.tierPercent} %</td>
                      <td className="py-2 text-right">{euro(m.baseCommission)}</td>
                      <td className="py-2 text-right text-gold">
                        {m.bonus > 0 ? `+${euro(m.bonus)}` : "—"}
                      </td>
                      <td className="py-2 text-right font-medium">{euro(m.tierCommission)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détail par client</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune ligne pour le moment.</p>
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
