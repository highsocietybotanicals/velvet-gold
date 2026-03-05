

## Personnalisation du Smart Checkout Viva Wallet

### Ce qu'on va faire

1. **Ajouter la couleur de marque (noir/or)** a l'URL de checkout via le parametre `&color=D4AF37` (or dore)
2. **Pre-selectionner le paiement par carte** via le parametre `&paymentMethod=0` (carte bancaire = methode 0 chez Viva)

### Concernant le logo

Le logo de la marque sur la page de paiement Viva Wallet se configure **uniquement** depuis le tableau de bord Viva Wallet (Banking App > Settings > Payment Sources > ton site). Ce n'est pas un parametre d'URL, il faut l'uploader manuellement dans ton compte Viva.

### Modification technique

**Fichier** : `supabase/functions/create-viva-payment/index.ts`

Ligne 187 — modifier l'URL de checkout :
```
checkoutUrl: `https://www.vivapayments.com/web/checkout?ref=${orderCode}&color=D4AF37&paymentMethod=0`
```

C'est un changement d'une seule ligne + redeploy de la fonction.

