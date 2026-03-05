

## Probleme identifie

L'OrderCode retourne par Viva Wallet (`9534731186721005`) depasse `Number.MAX_SAFE_INTEGER` (9007199254740991). Quand JavaScript parse le JSON, le nombre perd en precision et devient `9534731186721004` (off by 1). Le lien de checkout pointe donc vers un orderCode inexistant.

## Solution

Extraire l'OrderCode du texte brut de la reponse Viva via regex au lieu de se fier a `JSON.parse()` qui tronque les grands nombres.

### Fichier modifie : `supabase/functions/create-viva-payment/index.ts`

- Apres `vivaText`, extraire l'OrderCode avec une regex : `/\"OrderCode\":(\d+)/`
- Utiliser cette valeur string pour le `checkoutUrl` et le stockage en base
- Garder `JSON.parse` pour les autres champs (`ErrorCode`, etc.) qui ne sont pas affectes

Changement localise aux lignes 126-182 : extraction de l'orderCode comme string depuis le texte brut, puis utilisation de cette string partout.

