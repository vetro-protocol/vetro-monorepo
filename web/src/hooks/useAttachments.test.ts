import { describe, expect, it } from "vitest";

import { getAttachmentError } from "./useAttachments";

const image = (name: string, bytes = 1) =>
  new File([new Uint8Array(bytes)], name, { type: "image/png" });

describe("getAttachmentError", function () {
  it("accepts an empty list", function () {
    expect(getAttachmentError([])).toBeUndefined();
  });

  it("accepts PNG and JPG within the limits", function () {
    const files = [
      image("a.png"),
      new File([new Uint8Array(1)], "b.jpg", { type: "image/jpeg" }),
    ];
    expect(getAttachmentError(files)).toBeUndefined();
  });

  it("rejects a non-image file", function () {
    const files = [new File(["x"], "notes.pdf", { type: "application/pdf" })];
    expect(getAttachmentError(files)).toBe("invalid-type");
  });

  it("rejects more than five files", function () {
    const files = Array.from({ length: 6 }, (_, index) =>
      image(`shot-${index}.png`),
    );
    expect(getAttachmentError(files)).toBe("too-many");
  });

  it("rejects a set over the total size budget", function () {
    expect(getAttachmentError([image("big.png", 3_500_001)])).toBe("too-large");
  });
});
