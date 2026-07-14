import { describe, expect, it } from "vitest";

import { formatFileSize } from "./format";

describe("formatFileSize", function () {
  it("formats sizes under 1 KB in bytes", function () {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(999)).toBe("999 B");
  });

  it("formats kilobytes rounded to whole numbers", function () {
    expect(formatFileSize(1000)).toBe("1 KB");
    expect(formatFileSize(1500)).toBe("2 KB");
    expect(formatFileSize(999_000)).toBe("999 KB");
  });

  it("formats megabytes with one decimal", function () {
    expect(formatFileSize(1_000_000)).toBe("1.0 MB");
    expect(formatFileSize(3_500_000)).toBe("3.5 MB");
    // A size that rounds up to 1000 KB spills into MB instead of "1000 KB".
    expect(formatFileSize(999_500)).toBe("1.0 MB");
    expect(formatFileSize(999_499)).toBe("999 KB");
  });
});
