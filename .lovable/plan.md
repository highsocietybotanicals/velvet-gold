# Commandes manuelles : poids + prix libre + €/g automatique

## Objectif
Dans Logistique > Commande manuelle, chaque ligne produit permet de saisir le grammage (déjà possible) et de forcer librement le prix de vente, avec calcul en temps réel du prix au gramme. Ces valeurs sont celles enregistrées en base, donc elles alimentent automatiquement la facture, la comptabilité et la rentabilité.

## Ce que tu verras
Pour chaque ligne produit :

```text
[ Produit ▼ ]  [ 10 ] g  [ Prix TTC: 90.00 € ]  9.00 €/g   (tarif auto: 100.00 €)  [↺] [🗑]
```

- Poids en g : inchangé.
- Prix TTC de la ligne : pré-rempli avec le tarif automatique du site (grille dégressive), mais entièrement modifiable.
- Prix au gramme : recalculé en direct (prix ligne / poids) et affiché sous forme lisible.
- Rappel du tarif automatique + bouton « ↺ » pour revenir au prix calculé si tu as forcé un montant.
- Badge « Prix forcé » quand la ligne est en prix manuel, et écart affiché (ex. -10.00 € vs tarif).
- Le total commande, la remise promo et le total TTC reprennent les prix forcés.
- Si tu changes le poids d'une ligne en prix forcé, le prix au gramme saisi est conservé et le total de la ligne est recalculé (poids x €/g), pour éviter les incohérences.

## Impacts automatiques (aucune saisie supplémentaire)
- Facture PDF : le prix unitaire affiché devient le vrai prix au gramme pratiqué (HT calculé depuis le TTC forcé), et le total HT/TVA/TTC correspond.
- Comptabilité (exports par période) : basée sur `orders.total_amount` et les lignes, donc reprend directement les prix forcés.
- Rentabilité / marge par commande : `computeOrderMargin` utilise le chiffre d'affaires réel et les coûts matière au poids saisi. Avec un prix forcé plus bas, la marge et le coefficient affichés baissent en conséquence — c'est le comportement voulu.
- Cadeaux, échantillons 1g et code promo continuent de fonctionner comme aujourd'hui.

## Détails techniques
- `src/components/admin/ManualOrderCreator.tsx` :
  - `OrderLine` devient `{ productId, weight, priceOverride: number | null }`.
  - `calculateLineTotal` renvoie `priceOverride ?? calculateItemPrice(...).finalPrice`.
  - Nouveau helper `autoLineTotal(line)` (tarif grille) pour l'affichage du tarif de référence et le reset.
  - `pricePerGram = lineTotal / weight` affiché avec 2 décimales.
  - Changement de produit : réinitialise `priceOverride` à `null`.
  - Insertion en base : `unit_price` = prix au gramme réellement pratiqué (au lieu du prix catalogue brut), `total_price` = total de ligne forcé ou calculé. Le poids reste dans `weight`.
- `buildInvoiceHtml` : la colonne « Prix unit. HT » utilise `unit_price / 1.2` (donc le €/g réel) — logique inchangée, elle bénéficie du nouveau `unit_price`.
- Aucun changement de schéma de base de données ni d'edge function.

## Vérifications
- Ligne 10g de 911 OG : tarif auto affiché, prix forcé à 90 € => 9.00 €/g, total commande à 90 €.
- Facture générée : 10g, prix unit. HT 7.50 €, total TTC 90 €.
- Onglet Rentabilité : la commande apparaît avec le CA 90 € et une marge recalculée.
