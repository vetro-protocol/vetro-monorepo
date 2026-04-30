import "./instrument";
import "@rainbow-me/rainbowkit/styles.css";
import "./index.css";

import { reactErrorHandler } from "@sentry/react";
import { initializeI18n } from "i18n/config";
import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app";
import { Web3Provider } from "./providers/web3Provider";

initializeI18n();

ReactDOM.createRoot(document.getElementById("root")!, {
  onCaughtError: reactErrorHandler(),
  onRecoverableError: reactErrorHandler(),
  onUncaughtError: reactErrorHandler(),
}).render(
  <React.StrictMode>
    <Web3Provider>
      <App />
    </Web3Provider>
  </React.StrictMode>,
);
