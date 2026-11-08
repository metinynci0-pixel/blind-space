import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Uygulama kök alanı bulunamadı.");
}

createRoot(rootElement).render(<App />);
