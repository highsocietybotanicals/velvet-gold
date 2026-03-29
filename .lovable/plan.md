

# Plan : Simplifier les étiquettes — une seule image + grammage

## Contexte

Les nouvelles images uploadées contiennent DEJA le design de marque ET les mentions legales fusionnes dans une seule image. Il suffit donc d'utiliser cette image unique en pleine page et d'ajouter le grammage dynamiquement par-dessus.

## Modifications

### 1. Remplacer les 9 assets labels par les 8 nouvelles images

Copier les uploads vers `src/assets/labels/`, en ecrasant les anciens fichiers. Supprimer `legal-label.png` qui n'est plus necessaire.

| Upload | Destination |
|---|---|
| `user-uploads://911OG.jpg` | `src/assets/labels/911-og-label.png` |
| `user-uploads://blue_mango.jpg` | `src/assets/labels/blue-mango-label.png` |
| `user-uploads://Nuage_de_mousseux.jpg` | `src/assets/labels/nuage-label.png` |
| `user-uploads://golden.jpg` | `src/assets/labels/golden-label.png` |
| `user-uploads://ice_o_lator.jpg` | `src/assets/labels/ice-o-lator-label.png` |
| `user-uploads://amnesia.jpg` | `src/assets/labels/amnesia-label.png` |
| `user-uploads://mint_kush.jpg` | `src/assets/labels/mint-kush-label.png` |
| `user-uploads://platinium_og.jpg` | `src/assets/labels/platinum-og-label.png` |

### 2. Simplifier `src/lib/labelPdf.ts`

- Supprimer l'import de `labelLegal` (plus besoin)
- L'image unique occupe quasi toute la page (0 a ~140mm)
- Le grammage (ex: "5g") est ajoute en gros caracteres bold, positionne en bas de l'etiquette (~145mm), centre
- Plus de separateur ni de deuxieme image

```text
┌──────────────────┐  0mm
│                  │
│  IMAGE COMPLETE  │  L'image contient deja
│  (marque + legal │  le design + mentions
│   + pictogrammes)│
│                  │
│                  │
│                  │
├──────────────────┤  ~138mm
│      5g          │  Grammage dynamique bold
└──────────────────┘  150mm
```

