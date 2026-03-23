

# Fix PDF bloqué par Chrome

## Problème

`window.open(blobUrl, "_blank")` est bloqué par le popup blocker de Chrome car l'appel est asynchrone (après un `await fetch`). Chrome ne considère plus ça comme une action utilisateur directe.

## Solution

Remplacer `window.open()` par un téléchargement automatique via un lien `<a>` cliqué programmatiquement :

### Modifier `src/components/admin/ShippingLabel.tsx` (lignes 45-53)

```typescript
if (data?.pdfBase64) {
  const blob = new Blob(
    [Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0))],
    { type: "application/pdf" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `colissimo-${order.display_order_number || order.order_number}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

Le PDF sera directement téléchargé au lieu d'ouvrir un popup — Chrome ne bloque jamais les téléchargements déclenchés par un clic.

## Fichier modifié
- `src/components/admin/ShippingLabel.tsx`

