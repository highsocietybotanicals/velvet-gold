import { useState } from "react";
import emblemSvg from "@/assets/brand/hsb-emblem.svg?raw";
import { isLowEnd } from "@/components/minuit/minuitData";

/** Sceau de la barre latérale : emblème doré et enseigne néon (décor, ignoré des lecteurs d'écran). */
const AdminSeal = () => {
  // Appareil modeste : l'enseigne reste allumée sans bourdonner (aucune boucle permanente).
  const [lite] = useState(() => isLowEnd());
  return (
    <div className={lite ? "adm-seal is-lite" : "adm-seal"} aria-hidden="true">
      <span className="adm-seal-emb" dangerouslySetInnerHTML={{ __html: emblemSvg }} />
      <span className="adm-seal-txt">
        <span className="adm-seal-neon">High Society</span>
        <span className="adm-seal-kick">Salle de contrôle</span>
      </span>
    </div>
  );
};

export default AdminSeal;
