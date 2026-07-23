import { describe, expect, it, vi } from "vitest";

import { printResult } from "../src/lib/output.js";

const captureStdout = () =>
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);

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
