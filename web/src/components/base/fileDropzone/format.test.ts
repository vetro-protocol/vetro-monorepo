import { describe, expect, it } from "vitest";

import { formatFileSize } from "./format";

describe("formatFileSize", function () {
  it("formats sizes under 1 KB in bytes", function () {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1023)).toBe("1023 B");
  });

  it("formats kilobytes rounded to whole numbers", function () {
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1536)).toBe("2 KB");
    expect(formatFileSize(1024 * 1023)).toBe("1023 KB");
  });

  it("formats megabytes with one decimal", function () {
    expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
    expect(formatFileSize(3.5 * 1024 * 1024)).toBe("3.5 MB");
  });
});
