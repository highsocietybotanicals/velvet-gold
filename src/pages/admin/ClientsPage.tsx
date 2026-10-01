import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCustomers } from "@/hooks/useCustomers";
import {
  computeKpis, customersToCsv, findDuplicates, fmtEuro, fmtShortDate, matchesSearch, rhythmLabel,
  type Customer, type CustomerStatus,
} from "@/lib/customers";
import { Avatar, ErrorBox, ResellerBadge, Skeleton, StatusPill } from "@/components/admin/clients/ClientBits";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "hsb-crm-dismissed-duplicates";
const readDismissed = (): Set<string> => {
  try { return new Set(JSON.parse(localStorage.getItem(DISMISS_KEY) || "[]")); } catch { return new Set(); }
};

type Filter = "Tous" | CustomerStatus;
const FILTERS: { label: string; value: Filter }[] = [
  { label: "Tous", value: "Tous" },
  { label: "À relancer", value: "À relancer" },
  { label: "Bientôt", value: "Bientôt" },
  { label: "À l'heure", value: "À l'heure" },
  { label: "Nouveaux", value: "Nouveau" },
  { label: "Endormis", value: "Endormi" },
];
type Sort = "total" | "last" | "count";

const detailPath = (c: Customer) => `/admin/clients/${encodeURIComponent(c.key)}`;
const ago = (d: number) => (d === 0 ? "aujourd'hui" : `il y a ${d} jour${d > 1 ? "s" : ""}`);

const ClientsPage = () => {
  const navigate = useNavigate();
  const { customers, isLoading, error, merge } = useCustomers();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("Tous");
  const [sort, setSort] = useState<Sort>("total");
  const [dismissed, setDismissed] = useState<Set<string>>(readDismissed);
  const [busy, setBusy] = useState<string | null>(null);

  const kpis = useMemo(() => computeKpis(customers), [customers]);
  const duplicates = useMemo(() => findDuplicates(customers, dismissed), [customers, dismissed]);
  const searched = useMemo(() => customers.filter((c) => matchesSearch(c, q)), [customers, q]);
  const counts = useMemo(() => {
    const m: Record<string, number> = { Tous: searched.length };
    searched.forEach((c) => (m[c.status] = (m[c.status] || 0) + 1));
    return m;
  }, [searched]);
  const list = useMemo(() => {
    const l = filter === "Tous" ? searched : searched.filter((c) => c.status === filter);
    const s = [...l];
    if (sort === "total") s.sort((a, b) => b.totalSpent - a.totalSpent);
    if (sort === "last") s.sort((a, b) => b.lastOrderDate.getTime() - a.lastOrderDate.getTime());
    if (sort === "count") s.sort((a, b) => b.ordersCount - a.ordersCount);
    return s;
  }, [searched, filter, sort]);

  const dismiss = (id: string) => {
    const next = new Set(dismissed).add(id);
    setDismissed(next);
    try { localStorage.setItem(DISMISS_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
  };

  const doMerge = async (a: Customer, b: Customer, id: string) => {
    const [src, tgt] = a.ordersCount < b.ordersCount ? [a, b] : [b, a];
    setBusy(id);
    try {
      await merge(src.key, tgt.key);
      toast({ title: "Fiches fusionnées" });
    } catch (e: any) {
      toast({ title: "Fusion impossible", description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  const exportCsv = () => {
    const blob = new Blob(["\ufeff" + customersToCsv(list)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) return <ErrorBox error={error} />;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl gold-text">Clients</h1>
          {isLoading ? <Skeleton className="mt-2 h-4 w-56" /> : (
            <p className="mt-1 text-sm text-muted-foreground">
              {kpis.clients} clients identifiés depuis{" "}
              {kpis.firstDate?.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={isLoading} className="min-h-11 border-gold/40 text-gold hover:bg-gold/10">
          <Download className="mr-2 h-4 w-4" /> Exporter (CSV)
        </Button>
      </header>

      {/* KPI band */}
      <section aria-label="Indicateurs" className="grid grid-cols-2 overflow-hidden rounded-xl border border-gold/25 lg:grid-cols-4">
        {isLoading ? [0, 1, 2, 3].map((i) => <div key={i} className="p-5"><Skeleton className="h-16" /></div>) : [
          [`${kpis.loyal} fidèles`, `Ils ont passé ${kpis.loyalOrders} des ${kpis.totalOrders} commandes.`],
          [`${Math.round(kpis.top2Share * 100)} %`, "du chiffre d'affaires vient de vos 2 meilleurs clients."],
          [`${kpis.toRelaunch} à relancer`, "ont dépassé leur rythme habituel."],
          [`${kpis.asleep} endormis`, "sans commande depuis plus de 3 mois."],
        ].map(([big, small], i) => (
          <div key={i} className={cn("p-5 border-gold/15", i % 2 === 0 && "border-r", i < 2 && "border-b lg:border-b-0", i === 1 && "lg:border-r", i === 2 && "lg:border-r")}>
            <p className="font-display text-2xl text-gold sm:text-3xl">{big}</p>
            <p className="mt-1 text-xs text-muted-foreground">{small}</p>
          </div>
        ))}
      </section>

      {/* Duplicates */}
      {duplicates.map(({ a, b, id }) => (
        <div key={id} className="flex flex-col gap-3 rounded-xl border border-gold/30 bg-gold/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            <strong>{a.name}</strong> apparaît sous deux identifiants ({a.ordersCount} + {b.ordersCount} commandes,{" "}
            {fmtEuro(a.totalSpent + b.totalSpent)} au total).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="min-h-11" disabled={busy === id} onClick={() => doMerge(a, b, id)}>Fusionner les deux fiches</Button>
            <Button size="sm" variant="ghost" className="min-h-11" onClick={() => dismiss(id)}>Ce sont deux personnes</Button>
          </div>
        </div>
      ))}

      {/* Controls */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Rechercher un client</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, téléphone, e-mail, produit…" className="min-h-11 pl-9" />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Trier par
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="min-h-11 rounded-md border border-input bg-background px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="total">Total dépensé</option>
              <option value="last">Dernière commande</option>
              <option value="count">Nombre de commandes</option>
            </select>
          </label>
        </div>
        <div role="group" aria-label="Filtrer par statut" className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "min-h-11 whitespace-nowrap rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filter === f.value ? "border-gold bg-gold/15 text-gold" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label} <span className="opacity-70">({counts[f.value] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : list.length === 0 ? (
        <p className="rounded-xl border border-gold/20 p-10 text-center text-sm text-muted-foreground">Aucun client dans cette catégorie.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-gold/20 md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold/20 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  {["Client", "Commandes", "Total", "Panier moyen", "Dernière commande", "Rythme", "Produit du moment", "Statut"].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr
                    key={c.key}
                    className="cursor-pointer border-b border-border/30 transition-colors hover:bg-gold/5"
                    onClick={() => navigate(detailPath(c))}
                  >
                    <td className="px-4 py-3">
                      <Link to={detailPath(c)} className="flex items-center gap-3 focus-visible:outline-none" onClick={(e) => e.stopPropagation()}>
                        <Avatar name={c.name} />
                        <span>
                          <span className="block font-medium">{c.name}</span>
                          <span className="block text-xs text-muted-foreground">{c.isReseller ? <ResellerBadge /> : c.deliveryHabit}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">{c.ordersCount}</td>
                    <td className="px-4 py-3 font-display text-gold">{fmtEuro(c.totalSpent)}</td>
                    <td className="px-4 py-3">{fmtEuro(c.avgBasket)}</td>
                    <td className="px-4 py-3">{fmtShortDate(c.lastOrderDate)}<span className="block text-xs text-muted-foreground">{ago(c.daysSinceLast)}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{rhythmLabel(c)}</td>
                    <td className="px-4 py-3">{c.productOfTheMoment || "—"}</td>
                    <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {list.map((c) => (
              <li key={c.key}>
                <Link to={detailPath(c)} className="block rounded-xl border border-gold/20 p-4 transition-colors hover:bg-gold/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.isReseller ? <ResellerBadge /> : c.deliveryHabit}</p>
                    </div>
                    <StatusPill status={c.status} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div><dt className="text-muted-foreground">Total</dt><dd className="font-display text-base text-gold">{fmtEuro(c.totalSpent)}</dd></div>
                    <div><dt className="text-muted-foreground">Commandes</dt><dd>{c.ordersCount} · panier {fmtEuro(c.avgBasket)}</dd></div>
                    <div><dt className="text-muted-foreground">Dernière</dt><dd>{fmtShortDate(c.lastOrderDate)} · {ago(c.daysSinceLast)}</dd></div>
                    <div><dt className="text-muted-foreground">Rythme</dt><dd>{rhythmLabel(c)}</dd></div>
                    <div className="col-span-2"><dt className="text-muted-foreground">Produit du moment</dt><dd>{c.productOfTheMoment || "—"}</dd></div>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default ClientsPage;
