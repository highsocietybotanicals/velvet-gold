

## Activer la protection contre les mots de passe compromis

C'est le seul problème de sécurité restant. Voici les étapes exactes :

1. **Ouvrir les paramètres d'authentification** : Dans l'interface Lovable, cliquez sur l'icône **Cloud** (dans la barre de navigation au-dessus de l'aperçu), puis allez dans **Users** → cliquez sur l'icône **engrenage** ("Auth settings").

2. **Aller dans les paramètres Email** : Dans le panneau qui s'ouvre, cliquez sur l'onglet ou la section **"Email settings"**.

3. **Activer la vérification HIBP** : Cherchez l'option **"Password HIBP Check"** (ou "Leaked password protection"). Activez-la en cochant le toggle/switch.

4. **Sauvegarder** les changements.

Cette fonctionnalité vérifie automatiquement si un mot de passe choisi par un utilisateur a été compromis dans une fuite de données connue (base HaveIBeenPwned). Si c'est le cas, l'inscription ou le changement de mot de passe sera refusé.

**Aucun changement de code n'est nécessaire** — c'est un réglage backend uniquement.

