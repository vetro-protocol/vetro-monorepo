import "@rainbow-me/rainbowkit/styles.css";
import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app";
import { Web3Provider } from "./providers/web3Provider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Web3Provider>
      <App />
    </Web3Provider>
  </React.StrictMode>,
);
