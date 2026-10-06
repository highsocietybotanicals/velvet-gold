import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Phone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCustomers } from "@/hooks/useCustomers";
import { fmtDate, fmtEuro, fmtShortDate, parisMonthKey, fmtMonth, paymentLabel } from "@/lib/customers";
import { Avatar, ErrorBox, ResellerBadge, Skeleton, StatusPill } from "@/components/admin/clients/ClientBits";
import OrderTimeline from "@/components/admin/clients/OrderTimeline";
import MessageDialog from "@/components/admin/clients/MessageDialog";
import PrivateNotes from "@/components/admin/clients/PrivateNotes";
import { cn } from "@/lib/utils";

const card = "adm-panel rounded-xl border border-gold/25 p-5 sm:p-6";

const ClientDetailPage = () => {
  const { key = "" } = useParams();
  const decoded = decodeURIComponent(key);
  const { customers, isLoading, error, unmerge } = useCustomers();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const c = useMemo(
    () => customers.find((x) => x.key === decoded) || customers.find((x) => x.allKeys.includes(decoded)),
    [customers, decoded]
  );

  const back = (
    <Link to="/admin/clients" className="adm-back inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
      <ArrowLeft className="h-4 w-4" /> Tous les clients
    </Link>
  );

  if (error) return <div className="space-y-4">{back}<ErrorBox error={error} /></div>;
  if (isLoading) return <div className="space-y-4">{back}<Skeleton className="h-24" /><Skeleton className="h-48" /><Skeleton className="h-32" /></div>;
  if (!c) return <div className="space-y-4">{back}<p className="text-muted-foreground">Client introuvable.</p></div>;

  const phone = c.phones[0];
  const nowMonth = parisMonthKey(new Date());

  const doUnmerge = async (source: string) => {
    setBusy(source);
    try { await unmerge(source); toast({ title: "Fusion annulée" }); }
    catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      {back}

      <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={c.name} size="lg" />
          <div>
            <h1 className="adm-dossier font-display text-3xl gold-text">{c.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Client depuis le {fmtDate(c.firstOrderDate)} · {c.ordersCount} commande{c.ordersCount > 1 ? "s" : ""} · {c.deliveryHabit}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusPill status={c.status} />
              {c.isReseller && <ResellerBadge />}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <MessageDialog c={c} />
          {phone && (
            <Button asChild variant="outline" className="min-h-11 border-gold/40">
              <a href={`tel:${phone}`}><Phone className="mr-2 h-4 w-4" />Appeler</a>
            </Button>
          )}
          <Button asChild variant="outline" className="min-h-11 border-gold/40">
            <Link to="/admin/commandes"><Plus className="mr-2 h-4 w-4" />Nouvelle commande</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className={`${card} adm-screen`}>
        {c.ordersCount >= 2 ? (
          <>
            {c.overdueDays > 0 ? (
              <h2 className="font-display text-2xl text-orange-300">En retard de {c.overdueDays} jours sur son rythme</h2>
            ) : (
              <h2 className="font-display text-2xl">Prochaine commande attendue vers le {fmtDate(c.predictedNextDate!)}</h2>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              Il commande en moyenne tous les {Math.round(c.avgIntervalDays!)} jours. Dernière fois : il y a {c.daysSinceLast} jour{c.daysSinceLast > 1 ? "s" : ""}.
            </p>
          </>
        ) : (
          <h2 className="font-display text-2xl">Première commande le {fmtDate(c.firstOrderDate)}</h2>
        )}
        <OrderTimeline c={c} />
      </section>

      {/* KPIs */}
      <section aria-label="Indicateurs" className="adm-kpis grid grid-cols-2 overflow-hidden rounded-xl border border-gold/25 lg:grid-cols-4">
        {[
          ["Total dépensé", fmtEuro(c.totalSpent), `${(c.shareOfRevenue * 100).toFixed(1).replace(".", ",")} % de votre chiffre`],
          ["Panier moyen", fmtEuro(c.avgBasket), ""],
          ["Quantité habituelle", c.typicalGrams ? `${c.typicalGrams.toLocaleString("fr-FR")} g` : "—", "par commande la plupart du temps"],
          ["Paiement", "", c.paymentHabit],
        ].map(([label, big, small], i) => (
          <div key={label} className={cn("p-5 border-gold/15", i % 2 === 0 && "border-r", i < 2 && "border-b lg:border-b-0", i >= 1 && i < 3 && "lg:border-r")}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            {big && <p className="mt-1 font-display text-2xl text-gold sm:text-3xl">{big}</p>}
            {small && <p className={cn("mt-1 text-xs", big ? "text-muted-foreground" : "text-base first-letter:uppercase")}>{small}</p>}
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card}>
          <h2 className="font-display text-lg">Ses goûts</h2>
          {c.tastesByMonth.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {c.tastesByMonth.map((t) => (
                <li key={t.month} className={cn("rounded-full border px-3 py-1.5 text-xs", t.month === nowMonth ? "border-gold bg-gold/15 text-gold" : "border-border")}>
                  <span className="capitalize text-muted-foreground">{fmtMonth(t.month)}</span> · {t.product}
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-sm text-muted-foreground">Aucun produit payant enregistré.</p>}
          {c.favoriteProduct && <p className="mt-4 text-sm">Produit favori : <span className="text-gold">{c.favoriteProduct}</span></p>}
        </section>

        <section className={card}>
          <PrivateNotes canonicalKey={c.key} allKeys={c.allKeys} />
        </section>
      </div>

      {c.merges.length > 0 && (
        <section className={card}>
          <h2 className="font-display text-lg">Fusions</h2>
          <ul className="mt-3 space-y-2">
            {c.merges.map((m) => (
              <li key={m.source_key} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="break-all text-muted-foreground">{m.source_key} → {m.target_key}</span>
                <Button size="sm" variant="ghost" className="min-h-11" disabled={busy === m.source_key} onClick={() => doUnmerge(m.source_key)}>Annuler la fusion</Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={card}>
        <h2 className="font-display text-lg">Contact</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {c.phones.map((p) => <li key={p}><a href={`tel:${p}`} className="hover:text-gold">{p.replace(/(\d{2})(?=\d)/g, "$1 ")}</a></li>)}
          {c.emails.map((e) => <li key={e}><a href={`mailto:${e}`} className="break-all hover:text-gold">{e}</a></li>)}
          {!c.phones.length && !c.emails.length && <li className="text-muted-foreground">Aucun contact connu.</li>}
        </ul>
      </section>

      <section className={card}>
        <h2 className="font-display text-lg">Historique des commandes</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold/20 text-left text-xs uppercase text-muted-foreground">
                <th scope="col" className="py-2 pr-4">Date</th>
                <th scope="col" className="py-2 pr-4">Produits</th>
                <th scope="col" className="py-2 pr-4">Paiement</th>
                <th scope="col" className="py-2 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {[...c.orders].reverse().map((o) => (
                <tr key={o.id} className="border-b border-border/30 align-top">
                  <td className="py-2 pr-4 whitespace-nowrap">{fmtShortDate(o.date)}</td>
                  <td className="py-2 pr-4">{o.products.length ? o.products.map((p) => `${p.name}${p.quantity > 1 ? ` ×${p.quantity}` : ""}`).join(", ") : "—"}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{paymentLabel(o.paymentMethod)}</td>
                  <td className="py-2 text-right font-display text-gold whitespace-nowrap">{fmtEuro(o.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ClientDetailPage;
