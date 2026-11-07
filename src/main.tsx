import { Capacitor } from "@capacitor/core";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

document.documentElement.classList.toggle(
  "dark",
  window.localStorage.getItem("biocertifica-theme") === "dark",
);

// No app instalado os arquivos já vêm no APK; um service worker só poderia servir versões antigas.
if (!Capacitor.isNativePlatform()) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById("root")!).render(<App />);
