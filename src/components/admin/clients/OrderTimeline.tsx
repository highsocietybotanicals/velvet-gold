import { addDays, fmtEuro, fmtShortDate, parisMonthKey, type Customer } from "@/lib/customers";

/** Horizontal timeline: one gold dot per order, dashed dot for the predicted date. */
const OrderTimeline = ({ c }: { c: Customer }) => {
  const first = new Date(c.firstOrderDate);
  const start = new Date(first.getFullYear(), first.getMonth(), 1).getTime();
  const endDate = c.predictedNextDate ? addDays(c.predictedNextDate, 14) : addDays(c.lastOrderDate, 30);
  const end = Math.max(endDate.getTime(), start + 86400000 * 30);
  const pos = (d: Date) => ((d.getTime() - start) / (end - start)) * 100;
  const maxAmount = Math.max(...c.orders.map((o) => o.amount), 1);

  const months: { key: string; left: number; label: string }[] = [];
  for (let d = new Date(start); d.getTime() <= end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    months.push({ key: parisMonthKey(d), left: pos(d), label: d.toLocaleDateString("fr-FR", { month: "short" }) });
  }
  const step = Math.ceil(months.length / 8);

  return (
    <div className="mt-6 px-3" role="img" aria-label={`Frise de ${c.ordersCount} commandes`}>
      <div className="relative h-12">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gold/30" />
        {c.orders.map((o) => {
          const size = 8 + (o.amount / maxAmount) * 14;
          return (
            <span
              key={o.id}
              title={`${fmtShortDate(o.date)} : ${fmtEuro(o.amount)}`}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
              style={{ left: `${pos(o.date)}%`, width: size, height: size }}
            />
          );
        })}
        {c.predictedNextDate && (
          <span
            title={`Prévue vers le ${fmtShortDate(c.predictedNextDate)}`}
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-gold"
            style={{ left: `${pos(c.predictedNextDate)}%` }}
          />
        )}
      </div>
      <div className="relative h-5 text-[10px] uppercase text-muted-foreground">
        {months.map((m, i) => i % step === 0 && (
          <span key={m.key} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${m.left}%` }}>{m.label}</span>
        ))}
      </div>
    </div>
  );
};

export default OrderTimeline;
