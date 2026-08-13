import { afterEach, describe, expect, it, vi } from "vitest";

import {
  printError,
  printResult,
  printTransactionRequest,
} from "../src/lib/output.ts";

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

describe("printTransactionRequest", function () {
  it("emits the chain it was given as a hex QUANTITY", function () {
    const spy = captureStdout();
    printTransactionRequest({
      chainId: 1,
      data: "0xdeadbeef",
      to: "0xDaD503f8B9d42bb7af3AfC588358D30163e4416F",
    });
    expect(spy).toHaveBeenCalledWith(
      '{"chainId":"0x1","data":"0xdeadbeef","to":"0xDaD503f8B9d42bb7af3AfC588358D30163e4416F","value":"0x0"}\n',
    );
  });
});

describe("printError", function () {
  afterEach(function () {
    process.exitCode = 0;
  });

  it("redacts the resolved RPC URL so a key doesn't leak", function () {
    const spy = captureStderr();
    printError({
      error: new Error(
        "HTTP request failed. URL: https://eth-mainnet.example/v2/SECRET_KEY",
      ),
      rpcUrl: "https://eth-mainnet.example/v2/SECRET_KEY",
    });
    expect(spy).toHaveBeenCalledWith(
      '{"error":"HTTP request failed. URL: [redacted]"}\n',
    );
    expect(process.exitCode).toBe(1);
  });

  it("redacts every occurrence of the URL", function () {
    const spy = captureStderr();
    printError({
      error: new Error(
        "https://secret.example/KEY failed; retry https://secret.example/KEY",
      ),
      rpcUrl: "https://secret.example/KEY",
    });
    expect(spy).toHaveBeenCalledWith(
      '{"error":"[redacted] failed; retry [redacted]"}\n',
    );
  });

  it("passes the message through when no RPC URL was configured", function () {
    const spy = captureStderr();
    printError({ error: new Error("boom") });
    expect(spy).toHaveBeenCalledWith('{"error":"boom"}\n');
  });

  it("stringifies a non-Error rejection", function () {
    const spy = captureStderr();
    printError({ error: "plain failure" });
    expect(spy).toHaveBeenCalledWith('{"error":"plain failure"}\n');
  });
});
