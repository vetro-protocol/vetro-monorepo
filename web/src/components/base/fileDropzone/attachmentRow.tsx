import { ButtonIcon } from "components/base/button";
import { Spinner } from "components/base/spinner";
import { CheckIcon } from "components/icons/checkIcon";
import { FileIcon } from "components/icons/fileIcon";
import { TrashIcon } from "components/icons/trashIcon";
import { Tooltip } from "components/tooltip";

import { formatFileSize } from "./format";

type Props = {
  file: File;
  isUploading: boolean;
  onRemove: (file: File) => void;
  removeLabel: string;
  uploadedLabel: string;
  uploadingLabel: string;
};

export const AttachmentRow = ({
  file,
  isUploading,
  onRemove,
  removeLabel,
  uploadedLabel,
  uploadingLabel,
}: Props) => (
  <li className="flex items-center justify-between gap-2 border-gray-200 py-3 not-first:border-t">
    <div className="flex min-w-0 items-center gap-2">
      <div className="relative flex size-8 shrink-0 items-center justify-center rounded bg-gray-50">
        <FileIcon className="size-4 text-gray-600" />
        <span className="absolute -right-1 -bottom-1 flex size-3.5 items-center justify-center rounded-full bg-white">
          {isUploading ? (
            <Spinner size="small" />
          ) : (
            <span className="flex size-3 items-center justify-center rounded-full bg-blue-500">
              <CheckIcon className="size-2" />
            </span>
          )}
        </span>
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="text-b-regular truncate text-gray-900">
          {file.name}
        </span>
        <span className="text-caption text-gray-500">
          {formatFileSize(file.size)} ·{" "}
          {isUploading ? uploadingLabel : uploadedLabel}
        </span>
      </div>
    </div>
    <Tooltip content={removeLabel}>
      <ButtonIcon
        aria-label={removeLabel}
        disabled={isUploading}
        onClick={() => onRemove(file)}
        size="xSmall"
        type="button"
        variant="tertiary"
      >
        <TrashIcon />
      </ButtonIcon>
    </Tooltip>
  </li>
);
