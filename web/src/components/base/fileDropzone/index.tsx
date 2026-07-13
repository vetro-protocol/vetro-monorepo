import { Button } from "components/base/button";
import {
  type ChangeEvent,
  type DragEvent,
  useId,
  useRef,
  useState,
} from "react";

import { AttachmentRow } from "./attachmentRow";

type Props = {
  // File types the native picker offers, as `accept` attribute tokens: MIME
  // types ("image/png"), wildcards ("image/*"), or extensions (".pdf").
  accept: string[];
  errorMessage?: string;
  files: File[];
  hint: string;
  isUploading?: boolean;
  onFilesAdded: (files: File[]) => void;
  onRemove: (file: File) => void;
  removeLabel: string;
  selectLabel: string;
  uploadedLabel: string;
  uploadingLabel: string;
};

export function FileDropzone({
  accept,
  errorMessage,
  files,
  hint,
  isUploading = false,
  onFilesAdded,
  onRemove,
  removeLabel,
  selectLabel,
  uploadedLabel,
  uploadingLabel,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const errorId = useId();

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    onFilesAdded(Array.from(event.dataTransfer.files));
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    // Ignore the dragleave that fires when the cursor moves onto a child
    // element (relatedTarget stays within the zone), so the highlight doesn't
    // flicker while dragging over the hint or button.
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setDragging(false);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onFilesAdded(Array.from(event.target.files ?? []));
    // Clear so re-selecting the same file fires onChange again.
    event.target.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        aria-describedby={errorMessage ? errorId : undefined}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-zinc-50 px-3 py-6 transition-colors ${
          dragging ? "border-gray-400" : "border-gray-200"
        }`}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <p className="text-b-regular text-center text-gray-500">{hint}</p>
        <Button
          onClick={() => inputRef.current?.click()}
          size="xSmall"
          type="button"
          variant="secondary"
        >
          {selectLabel}
        </Button>
        <input
          accept={accept.join(",")}
          className="hidden"
          multiple
          onChange={handleChange}
          ref={inputRef}
          type="file"
        />
      </div>

      {files.length > 0 ? (
        <ul className="flex flex-col">
          {files.map((file, index) => (
            <AttachmentRow
              file={file}
              isUploading={isUploading}
              key={`${file.name}-${index}`}
              onRemove={onRemove}
              removeLabel={removeLabel}
              uploadedLabel={uploadedLabel}
              uploadingLabel={uploadingLabel}
            />
          ))}
        </ul>
      ) : null}

      {errorMessage ? (
        <p className="text-b-regular text-rose-600" id={errorId} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
