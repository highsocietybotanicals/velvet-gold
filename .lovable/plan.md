

## Remplacer le logo Lovable dans les résultats Google

### Problème
Les balises `og:image` et `twitter:image` dans `index.html` pointent vers `https://lovable.dev/opengraph-image-p98pqg.png` — c'est l'image qui s'affiche dans Google et sur les réseaux sociaux.

### Solution
Remplacer ces URLs par le logo de la marque. On utilisera l'URL du logo déjà en place pour le favicon (ou une autre image fournie par l'utilisateur).

### Modification

**Fichier** : `index.html`

- Ligne 16 : `og:image` → remplacer par l'URL du logo HSB
- Ligne 18 : `twitter:image` → idem

Les deux lignes passeront de :
```
https://lovable.dev/opengraph-image-p98pqg.png
```
à l'URL du logo de la marque.

> Note : Google recommande une image OG de 1200x630px minimum. Le logo favicon (petit format JPEG) fonctionnera mais une image plus grande et adaptée serait idéale pour un meilleur rendu.

