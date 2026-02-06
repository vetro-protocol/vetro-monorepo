import "dotenv/config";

import type { ConsoleLevel } from "@sentry/core";
import * as Sentry from "@sentry/node";
import config from "config";
import cors from "cors";
import express from "express";

import * as middlewareFactory from "./src/middleware-factory.ts";
import { originGlobToRegExp } from "./src/origin-glob-to-regexp.ts";
import * as paramValidators from "./src/param-validators.ts";
import * as variableStake from "./src/variable-stake.ts";

const { dsn, loggingLevels } = config.get<{
  dsn?: string;
  loggingLevels: ConsoleLevel[];
}>("sentry");
if (dsn) {
  Sentry.init({
    dsn,
    enableLogs: true,
    environment: process.env.NODE_ENV || "development",
    integrations: [Sentry.consoleLoggingIntegration({ levels: loggingLevels })],
    sendDefaultPii: true,
  });
}

const app = express();

const origin = config
  .get<string>("origins")
  .split(",")
  .map((o) => (/\*/.test(o) ? originGlobToRegExp(o) : o));
app.use(cors({ origin }));
app.disable("x-powered-by");

// Variable Stake Endpoints

app.get(
  "/variable-stake/apy",
  middlewareFactory.asyncJson(variableStake.getApy),
);
app.get(
  "/variable-stake/rewards/:address",
  paramValidators.validateAddress,
  middlewareFactory.asyncJson(variableStake.getUserRewards),
);
app.get(
  "/variable-stake/exit-tickets/:address",
  paramValidators.validateAddress,
  middlewareFactory.asyncJson(variableStake.getUserExitTickets),
);

// Error handling

app.use(function (req, res) {
  res.status(404).send({ error: "Not Found" });
});
Sentry.setupExpressErrorHandler(app);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(function (error, req, res, next) {
  console.error("Internal Server Error:", error);
  res.status(500).send({ error: "Internal Server Error" });
});

const port = config.get("port");
app.listen(port, function () {
  const version = config.get("version");
  console.log(`Vetro backend v${version} running on port ${port}`);
  console.debug(`Config: ${JSON.stringify(config.util.toObject())}`);
});
