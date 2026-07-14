/**
 * Human-readable file size for the attachment rows (e.g. "512 B", "24 KB",
 * "1.2 MB"). Uses 1000-based (decimal) units so row sizes line up with the
 * decimal MB limit shown in the "too large" error. KB is rounded, MB keeps one
 * decimal.
 */
export function formatFileSize(bytes: number) {
  if (bytes < 1000) {
    return `${bytes} B`;
  }
  const kb = bytes / 1000;
  if (Math.round(kb) < 1000) {
    return `${Math.round(kb)} KB`;
  }
  return `${(kb / 1000).toFixed(1)} MB`;
}
