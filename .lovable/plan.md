

## Réponse : Viva Wallet ne gère pas les étiquettes d'expédition

Viva Wallet est uniquement un système de **paiement**. Il peut pré-remplir le nom et l'email du client sur sa page de paiement (paramètres `fullName` et `email`), mais il ne collecte **pas** d'adresse postale et ne génère **aucune étiquette d'expédition**.

Ce que Viva sait faire : encaisser l'argent, point final.

---

## Ce que je propose : Génération automatique d'étiquette de colis

Au lieu de compter sur Viva, on peut générer une **étiquette imprimable** directement depuis votre page admin, avec les infos déjà collectées lors de la commande.

### Fonctionnement

1. **Pré-remplir `fullName` et `email` sur Viva** — On passe ces infos lors de la création du payment order pour que le client n'ait pas à les retaper sur la page de paiement (améliore le taux de conversion).

2. **Bouton "Imprimer étiquette"** dans la page admin — Pour chaque commande avec `delivery_type = "postal"`, un bouton ouvre une fenêtre d'impression avec :
   - Votre adresse d'expéditeur (configurable)
   - Nom du destinataire (`guest_name` ou nom du profil)
   - Adresse complète (`delivery_address`)
   - Téléphone (`contact_phone` ou `guest_phone`)
   - Numéro de commande (`display_order_number`)

3. **Format étiquette** — Un layout CSS optimisé pour impression sur étiquette autocollante standard (format A6 ou 10x15cm), avec `@media print` pour masquer le reste de la page.

### Modifications techniques

- **Edge function `create-viva-payment`** : Ajouter `fullName` et `email` dans l'appel API Viva pour pré-remplir le formulaire de paiement
- **`AdminPage.tsx`** : Ajouter un bouton "🏷️ Étiquette" sur chaque commande postale qui ouvre une fenêtre `window.print()` avec le layout d'étiquette formaté
- **Nouveau composant `ShippingLabel.tsx`** : Composant d'étiquette imprimable avec styles `@media print`

### Résultat
Pour chaque commande postale payée, vous cliquez sur "Étiquette", ça ouvre une page propre que vous imprimez et collez sur le colis. Zéro saisie manuelle.

