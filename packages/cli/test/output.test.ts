import { afterEach, describe, expect, it, vi } from "vitest";

import { printError, printResult } from "../src/lib/output.js";

const captureStdout = () =>
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);

const captureStderr = () =>
  vi.spyOn(process.stderr, "write").mockImplementation(() => true);

describe("printResult", function () {
  it("serializes bigint values as decimal strings", function () {
    const spy = captureStdout();
    printResult(120n);
    expect(spy).toHaveBeenCalledWith('"120"\n');
  });

  it("serializes addresses as bare JSON strings", function () {
    const spy = captureStdout();
    printResult("0xDaD503f8B9d42bb7af3AfC588358D30163e4416F");
    expect(spy).toHaveBeenCalledWith(
      '"0xDaD503f8B9d42bb7af3AfC588358D30163e4416F"\n',
    );
  });

  it("serializes booleans as-is", function () {
    const spy = captureStdout();
    printResult(false);
    expect(spy).toHaveBeenCalledWith("false\n");
  });

  it("serializes nested bigints inside objects", function () {
    const spy = captureStdout();
    printResult({ amountLocked: 1000n, status: "cooldown" });
    expect(spy).toHaveBeenCalledWith(
      '{"amountLocked":"1000","status":"cooldown"}\n',
    );
  });

  it("serializes undefined as null to stay valid JSON", function () {
    const spy = captureStdout();
    printResult(undefined);
    expect(spy).toHaveBeenCalledWith("null\n");
  });
});

describe("printError", function () {
  const originalRpcUrl = process.env.RPC_URL;

  afterEach(function () {
    if (originalRpcUrl === undefined) {
      delete process.env.RPC_URL;
    } else {
      process.env.RPC_URL = originalRpcUrl;
    }
    process.exitCode = 0;
  });

  it("redacts the configured RPC_URL so a key doesn't leak", function () {
    process.env.RPC_URL = "https://eth-mainnet.example/v2/SECRET_KEY";
    const spy = captureStderr();
    printError(
      new Error(
        "HTTP request failed. URL: https://eth-mainnet.example/v2/SECRET_KEY",
      ),
    );
    expect(spy).toHaveBeenCalledWith(
      '{"error":"HTTP request failed. URL: [redacted]"}\n',
    );
    expect(process.exitCode).toBe(1);
  });

  it("passes the message through when RPC_URL is unset", function () {
    delete process.env.RPC_URL;
    const spy = captureStderr();
    printError(new Error("boom"));
    expect(spy).toHaveBeenCalledWith('{"error":"boom"}\n');
  });
});
