import React from "react";
import ReactDOM from "react-dom/client";
import App from "./renderer/App";
import "./index.css";

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
