# Importer les étiquettes manquantes

Quatre variétés ont déjà leur étiquette importée (BHM, Lemon Punch Hash, Mango X Ice, Piatella). Les onze autres utilisent encore l'étiquette d'origine intégrée au site, sans fichier importé.

## Ce que je vais faire

Importer automatiquement l'étiquette d'origine de chaque variété qui n'en a pas encore, pour qu'elles apparaissent toutes comme « Étiquette importée » dans le catalogue de l'administration, visibles en aperçu, remplaçables et supprimables comme les autres.

Variétés concernées :

- En vente : Amnesia Signature Oniria, Blue Mango Indoor Master, Golden CBN, Ice O Lator, Mint Kush, Platinum OG
- Hors vente (gardées pour l'historique) : 911 OG Indoor Master, Haribo, Heisenberg, Nuage de Mousseux, Poussière D'or

Les étiquettes déjà importées ne sont pas touchées. Rien ne change sur les prix, les stocks ni les commandes.

Ensuite tu pourras remplacer n'importe laquelle par ta version officielle, une par une, directement depuis l'administration.

## Détails techniques

- Pour chaque produit sans `label_image_path`, envoyer le PNG correspondant de `src/assets/labels/` dans le bucket `product-labels` sous `<productId>/<timestamp>-etiquette.png`, puis renseigner `products.label_image_path`.
- Réalisé via l'API Storage avec une session administrateur (policies existantes : écriture admin, lecture admin + commercial).
- Vérification finale : requête sur `products` pour confirmer que chaque variété a un chemin d'étiquette, et contrôle qu'un lien signé d'aperçu répond correctement.
