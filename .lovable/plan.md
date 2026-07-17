## Objectif

Générer un PDF "Dossier de présentation associé" de 5-7 pages, dans la DA du site (fond noir profond, or #C9A96E, typographies Gloock / Crimson Pro, filets Art-Déco, particules d'or discrètes), destiné à un ami qui découvre le CBD et envisage de s'associer.

## Livrable

Fichier : `/mnt/documents/HSB-Dossier-Association.pdf` (A4 portrait, ~6 pages)

Servi via `<presentation-artifact>` en fin de réponse.

## Structure du document (6 pages)

1. **Couverture** — Logo/monogramme HSB doré, titre "Dossier de présentation — Opportunité d'association", sous-titre "Maison française de fleurs & résines CBD Haute Couture", date, mention confidentielle.

2. **La maison en un coup d'œil** — Concept "Haute Couture botanique", positionnement premium/luxe, 4 piliers (100% Indoor · Génétiques d'exception · Élixir Noir / Nectar Divin · Testé en laboratoire), périmètre légal (Cannabis Sativa L., THC < 0,3%, +18 ans).

3. **La gamme** — Les 3 collections expliquées simplement :
   - **Classique** (Groupe A/B) : fleurs & résines premium 12-15 €/g
   - **Force Noire** (Élixir Noir) : fleurs & résines infusées haute puissance
   - **Nectar Divin** : ultra-premium (Haribo, Heisenberg) 10-15 €/g, puissance supérieure
   Format tarifaire dégressif 1g / 2,5g / 5g / 10g. Visuels des 3 gammes.

4. **Comment on vend** — Les 3 canaux :
   - **B2C site** (highsocietybotanicals.com) : commande en ligne, paiement Viva Wallet, livraison Colissimo / Point Relais / locale, Sommelier virtuel, fidélité (1g/10g), avis clients
   - **B2B pro à pro** : facturation HT + TVA 20%, tarifs pros
   - **Dépôt-vente tabacs** : partenariat 70/30 (nous 70% TTC, buraliste 30%), passage bimensuel, facture pro auto
   Schéma simple du flux commande → paiement → expédition.

5. **Chiffres clés (confidentiels)** — Chiffres réels tirés de la base :
   - CA TTC B2C encaissé : **2 636,72 €** (29 commandes payées)
   - Panier moyen : **90,92 €**
   - CA Pro facturé : **904,25 €** (2 factures)
   - **CA total cumulé : 3 540,97 €**
   - Top produits (résines Nectar Divin, 911 OG, Platinum OG…) tirés des ventes réelles
   - Marge indicative sur gamme premium, mention de la phase de lancement

6. **Marché & opportunité d'association** —
   - Marché CBD France : ~700 M€ estimé, croissance annuelle à 2 chiffres, ~2000 boutiques, cadre légal stabilisé depuis arrêt Conseil d'État 2023
   - Positionnement HSB : niche luxe encore peu occupée face aux enseignes mass-market
   - Ce qu'un associé apporterait : capital, réseau tabacs/CHR, force commerciale terrain, développement B2B
   - Prochaines étapes suggérées : NDA → audit chiffres complets → discussion parts/rôles
   - Contact : contact@highsocietybotanicals.com

## Détails techniques

- Génération via **ReportLab Python** (Platypus + Canvas pour la couverture).
- Police Unicode DejaVu Sans (déjà dispo en sandbox) pour tous les caractères accentués, plus une seconde police serif si dispo pour titres, sinon DejaVu Serif.
- Palette : bg `#0A0A0A`, or `#C9A96E`, texte `#E8E4DC`, filets `#3A2E1F`.
- Filets Art-Déco fins en haut/bas de chaque page + petit monogramme "HSB" doré.
- Chiffres extraits en direct de la DB (orders `payment_status='paid'` + `status<>'cancelled'`, pro_invoices `status<>'cancelled'`, top produits via `order_items`).
- QA obligatoire : conversion PDF → images (`pdftoppm -jpeg -r 150`), inspection page par page (débordements, contraste, lisibilité), corrections, re-QA, puis livraison.
- Aucune modification de code applicatif — pur artefact document.
