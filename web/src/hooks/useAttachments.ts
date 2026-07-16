import { useState } from "react";

// Kept in sync with the API's attachment limits (api/src/contact.ts).
export const allowedTypes = ["image/jpeg", "image/png"];
export const maxCount = 5;
const maxTotalBytes = 3_500_000;
// Total-size limit in MB, for the "too large" message so it tracks the bytes.
export const maxTotalMb = maxTotalBytes / 1_000_000;

export type AttachmentError = "invalid-type" | "too-large" | "too-many";

export function getAttachmentError(files: File[]): AttachmentError | undefined {
  if (files.some((file) => !allowedTypes.includes(file.type))) {
    return "invalid-type";
  }
  if (files.length > maxCount) {
    return "too-many";
  }
  if (files.reduce((total, file) => total + file.size, 0) > maxTotalBytes) {
    return "too-large";
  }
  return undefined;
}

export function useAttachments() {
  const [state, setState] = useState<{
    error?: AttachmentError;
    files: File[];
  }>({ files: [] });

  function add(incoming: File[]) {
    setState(function (current) {
      const next = [...current.files, ...incoming];
      const error = getAttachmentError(next);
      // Rejected batches keep the existing files and surface the error.
      return error ? { error, files: current.files } : { files: next };
    });
  }

  function remove(file: File) {
    setState((current) => ({
      files: current.files.filter((candidate) => candidate !== file),
    }));
  }

  return {
    add,
    error: state.error,
    files: state.files,
    remove,
    reset() {
      setState({ files: [] });
    },
  };
}
