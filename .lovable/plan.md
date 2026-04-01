

# Flyer High Society Botanicals — Livraison locale

## Objectif
Créer un flyer A5 recto (PDF + image PNG) au style "Dark Luxury" noir/or, contenant :
- Logo et nom de la marque
- Tous les produits avec prix de base au gramme
- Grille de remises par paliers (Groupe A et Groupe B)
- Offres cadeaux (1g offert + kit RAW/BIC par tranche de 10g)
- Promo première commande (5g offerts pour 10g achetés)
- Mention livraison locale gratuite / zone desservie
- Contact (site web, téléphone/Instagram si dispo)

## Contenu du flyer

### Produits & Prix

**Fleurs :**
| Produit | Prix/g |
|---------|--------|
| Amnesia "Signature Oniria" 27% CBD | 10€ |
| Platinum OG 22% CBD | 11€ |
| Mint Kush 20% CBD | 15€ |
| 911 OG "Indoor Master" 50% Élixir Noir | 15€ |
| Blue Mango "Indoor Master" 30% Élixir Noir | 13€ |

**Résines :**
| Produit | Prix/g |
|---------|--------|
| Ice O Lator 60% CBD | 12€ |
| Golden CBN 25%CBD/10%CBN/10%CBG | 11€ |
| Nuage de Mousseux 50% Élixir Noir | 13€ |

### Grille de remises

**Collection Classique (Groupe A) :**
- 10g+ → -15% | 25g+ → -25% | 50g+ → -35% | 100g+ → -50%

**Gamme Force Noire (Groupe B) :**
- 10g+ → -10% | 25g+ → -20% | 50g+ → -25% | 100g+ → -35%

### Cadeaux & Promos
- 1g de fleurs offert par tranche de 10g achetés
- 1 Kit Cadeau (Feuilles Slim RAW + Briquet BIC) par tranche de 10g
- Première commande : 5g offerts pour 10g achetés

## Réalisation technique

1. Générer le flyer en PDF via **ReportLab** (Python) — format A5, fond noir, texte doré/blanc
2. Convertir en image PNG haute résolution via `pdftoppm`
3. QA visuelle obligatoire sur chaque rendu
4. Livrer les deux fichiers dans `/mnt/documents/`

## Fichiers livrés
- `flyer_hsb.pdf` — PDF prêt à imprimer
- `flyer_hsb.png` — Image haute résolution pour réseaux sociaux

