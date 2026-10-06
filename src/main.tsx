import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./minuit-skin.css";
import "./hsb-fx.css";
import { startHsbFx } from "./hsb-fx";

createRoot(document.getElementById("root")!).render(<App />);
startHsbFx();
