/**
 * Human-readable file size for the attachment rows (e.g. "512 B", "24 KB",
 * "1.2 MB"). Uses 1024-based units; KB is rounded, MB keeps one decimal.
 */
export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb)} KB`;
  }
  return `${(kb / 1024).toFixed(1)} MB`;
}
