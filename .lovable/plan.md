

# Afficher le code promo utilisé sur chaque facture

## Résumé

Quand un client utilise un code promo (quel qu'il soit — BIENVENUE15, DEMI160, ou autre), la facture imprimée doit afficher le code utilisé et le montant de la réduction. Actuellement, la facture ne montre que le total final sans détail promo.

## Changements

### 1. `src/pages/AdminPage.tsx`

- Après le fetch des commandes, faire un fetch de `promo_code_usage` pour toutes les commandes affichées (admin peut lire via service role, mais on a une policy admin SELECT manquante — il faudra ajouter une RLS policy)
- Joindre les données promo à chaque commande et les passer en props à `<OrderSummaryPrint>`

### 2. Migration — RLS policy pour que l'admin puisse lire `promo_code_usage`

```sql
CREATE POLICY "Admins can view all promo usage"
  ON public.promo_code_usage FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));
```

### 3. `src/components/admin/OrderSummaryPrint.tsx`

- Ajouter des props optionnelles `promo_code?: string`, `promo_discount_percent?: number`, `promo_discount_amount?: number`
- Calculer le sous-total (somme des items)
- Afficher entre les items et le total :
  ```
  Sous-total :                    XX.XX€
  Code DEMI160 (-XX%) :           -X.XX€
  ─────────────────────────────────
  TOTAL :                         XX.XX€
  ```
- La ligne promo n'apparaît que si un code a été utilisé

## Fichiers modifiés
- `src/pages/AdminPage.tsx` — fetch promo_code_usage + passer en props
- `src/components/admin/OrderSummaryPrint.tsx` — afficher sous-total + ligne promo
- Migration SQL — policy admin SELECT sur promo_code_usage

