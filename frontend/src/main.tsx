import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "@/context/auth";
import "./index.css";

// import { worker } from "@/mocks/browser"; // если понадобится вернуть моки

async function enableMocking() {
  // Раскомментируйте блок ниже, чтобы снова включить MSW
  // if (import.meta.env.DEV) {
  //   const { worker } = await import("@/mocks/browser");
  //   await worker.start({
  //     onUnhandledRequest: "bypass",
  //     serviceWorker: { url: "/mockServiceWorker.js" },
  //   });
  // }
}

// Вызываем функцию (она сейчас пустая) — оставлено для совместимости
enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
});