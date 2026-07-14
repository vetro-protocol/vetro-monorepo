import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { FileDropzone } from "../src/components/base/fileDropzone";

const meta = {
  component: FileDropzone,
  title: "Components/FileDropzone",
} satisfies Meta<typeof FileDropzone>;

export default meta;

type Story = StoryObj<typeof meta>;

const hint = "Drag and drop here or";
const removeLabel = "Delete";
const selectLabel = "Select files";
const uploadedLabel = "Attached";
const uploadingLabel = "Uploading...";

// Fabricate a File so the row UI can be shown without a real upload.
const fakeFile = (name: string) =>
  new File(["screenshot-bytes"], name, { type: "image/png" });

// files/onFilesAdded/onRemove are required props; each story's render() supplies
// the real stateful versions, but they must be here to satisfy the args type.
const baseArgs = {
  accept: ["image/png", "image/jpeg"],
  files: [],
  hint,
  onFilesAdded: () => undefined,
  onRemove: () => undefined,
  removeLabel,
  selectLabel,
  uploadedLabel,
  uploadingLabel,
};

export const Default: Story = {
  args: baseArgs,
  render: function Render(args) {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <div className="w-[352px]">
        <FileDropzone
          {...args}
          files={files}
          onFilesAdded={(added) =>
            setFiles((current) => [...current, ...added])
          }
          onRemove={(file) =>
            setFiles((current) => current.filter((f) => f !== file))
          }
        />
      </div>
    );
  },
};

export const Filled: Story = {
  args: baseArgs,
  render: function Render(args) {
    const [files, setFiles] = useState<File[]>([
      fakeFile("swap-error.png"),
      fakeFile("wallet-prompt.png"),
    ]);

    return (
      <div className="w-[352px]">
        <FileDropzone
          {...args}
          files={files}
          onFilesAdded={(added) =>
            setFiles((current) => [...current, ...added])
          }
          onRemove={(file) =>
            setFiles((current) => current.filter((f) => f !== file))
          }
        />
      </div>
    );
  },
};

export const Uploading: Story = {
  args: baseArgs,
  render: function Render(args) {
    const [files, setFiles] = useState<File[]>([
      fakeFile("swap-error.png"),
      fakeFile("wallet-prompt.png"),
    ]);

    return (
      <div className="w-[352px]">
        <FileDropzone
          {...args}
          files={files}
          isUploading
          onFilesAdded={(added) =>
            setFiles((current) => [...current, ...added])
          }
          onRemove={(file) =>
            setFiles((current) => current.filter((f) => f !== file))
          }
        />
      </div>
    );
  },
};

export const Error: Story = {
  args: {
    ...baseArgs,
    errorMessage: "Only PNG and JPG files are supported.",
  },
  render: function Render(args) {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <div className="w-[352px]">
        <FileDropzone
          {...args}
          files={files}
          onFilesAdded={(added) =>
            setFiles((current) => [...current, ...added])
          }
          onRemove={(file) =>
            setFiles((current) => current.filter((f) => f !== file))
          }
        />
      </div>
    );
  },
};
