import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

document.documentElement.classList.toggle(
  "dark",
  window.localStorage.getItem("biocertifica-theme") === "dark",
);

registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(<App />);
