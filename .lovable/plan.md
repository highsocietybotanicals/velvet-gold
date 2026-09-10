# Compte Commercial + Pro de Philippe Hélard

## Résultat attendu

- Créer le compte de **Philippe Hélard** avec l’adresse `ph.helard59@gmail.com`.
- Lui attribuer les deux accès : **Espace Commercial** et **Espace Pro**.
- Utiliser le mot de passe provisoire fourni et lui envoyer automatiquement un email professionnel avec ses accès.
- Ne lui donner aucun accès administrateur.
- Conserver la commission de départ actuelle à **10 %**, avec le secteur par défaut autour d’Abbaretz.

## Mise en œuvre

1. Ajouter une création de compte sécurisée réservée à l’administrateur, capable de créer un commercial avec les rôles `commercial` et `pro`, puis sa fiche de commercial.
2. Prévoir l’accès Pro spécial des commerciaux sans inventer de SIRET ou de numéro de TVA : catalogue, panier, devis, commandes et tarifs Pro seront autorisés par leur rôle commercial.
3. Adapter les protections côté interface, base de données et validation des commandes pour que cet accès spécial fonctionne réellement partout, tout en conservant les contrôles actuels des partenaires Pro ordinaires.
4. Envoyer à Philippe un email en français présentant les deux espaces, son adresse de connexion et son mot de passe provisoire, avec recommandation de le modifier après connexion.
5. Créer effectivement le compte de Philippe, vérifier ses deux rôles et sa fiche commerciale, puis tester la connexion et l’ouverture des espaces Commercial et Pro.

## Vérification Piatella

La base contient déjà quatre EAN-13 valides et distincts pour le Piatella : formats **1 g, 2,5 g, 5 g et 10 g**. Aucun changement n’est nécessaire sur ses codes-barres.

## Détails techniques

- La création et l’attribution des rôles seront réalisées côté serveur avec contrôle administrateur.
- Les rôles resteront dans la table dédiée aux autorisations ; aucun droit ne sera stocké dans le profil.
- Les règles d’accès aux tarifs Pro seront étendues uniquement aux commerciaux authentifiés.
- Le compte ne recevra jamais le rôle `admin`.
