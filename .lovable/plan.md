
Diagnostic rapide (confirmé)
- Le webhook est joignable et répond en 200, mais le corps actuel du GET est vide (`text/plain`).
- D’après la doc Viva, la vérification d’URL attend une réponse JSON contenant la clé de vérification (format type `{"Key":"..."}`), pas une réponse vide.
- Le secret `VIVA_WEBHOOK_VERIFICATION_KEY` n’existe pas actuellement, donc la fonction ne peut renvoyer aucune clé.

Plan de correction
1) Corriger `supabase/functions/viva-webhook/index.ts` (handler GET)
- Remplacer la logique GET actuelle.
- Au lieu de renvoyer du texte vide, appeler l’endpoint Viva de génération de clé :
  - Production: `https://www.vivapayments.com/api/messages/config/token`
  - Fallback demo: `https://demo.vivapayments.com/api/messages/config/token`
- Auth Basic avec `VIVA_MERCHANT_ID` + `VIVA_API_KEY`.
- Renvoyer au client Viva la réponse JSON (ou au minimum `{ "Key": "..." }`) avec `Content-Type: application/json` et statut 200.

2) Ajouter une stratégie de secours
- Si l’appel Viva token échoue, utiliser un fallback local:
  - soit secret `VIVA_WEBHOOK_VERIFICATION_KEY` (si configuré),
  - sinon erreur JSON explicite pour faciliter le debug (et logs clairs).
- Conserver les headers CORS et la gestion `OPTIONS`.

3) Ne pas toucher la logique POST métier
- Conserver intacte la partie webhook paiement (`EventTypeId 1796`, vérifications transaction/montant, update commande).

4) Vérification fonctionnelle
- Tester le GET du webhook (doit renvoyer JSON avec clé).
- Dans Viva: cliquer “Vérifier” puis “Sauvegarder”.
- Confirmer que le statut du webhook passe actif.
- Faire un test de paiement réel de bout en bout pour valider la mise à jour automatique de la commande.

Détails techniques (section dédiée)
- Fichier impacté: `supabase/functions/viva-webhook/index.ts` (bloc GET uniquement).
- Aucun changement DB/RLS requis.
- Cause racine: changement précédent vers `text/plain` vide, incompatible avec la vérification Viva qui attend un JSON de clé.
- Robustesse recommandée: tentative prod puis demo pour éviter blocage si compte Viva non aligné avec l’environnement.
