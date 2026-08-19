import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentType, ReactNode } from "react";

type Icon = {
  element: ReactNode;
  name: string;
  path: string;
};

const iconComponents = import.meta.glob<Record<string, ComponentType>>(
  "../src/**/*Icon.tsx",
  { eager: true },
);

const iconFiles = import.meta.glob<string>("../src/**/*.svg", {
  eager: true,
  import: "default",
});

const toPath = (globKey: string) => globKey.replace("../", "");

const toFileName = (globKey: string) => globKey.split("/").pop()!;

const icons: Icon[] = Object.entries(iconComponents)
  .flatMap(([globKey, module]) =>
    Object.entries(module)
      .filter(([name]) => name.endsWith("Icon"))
      .map(([, IconComponent]) => ({
        element: <IconComponent />,
        name: toFileName(globKey),
        path: toPath(globKey),
      })),
  )
  .concat(
    Object.entries(iconFiles).map(([globKey, url]) => ({
      element: <img alt="" className="size-full object-contain" src={url} />,
      name: toFileName(globKey),
      path: toPath(globKey),
    })),
  )
  .sort((a, b) => a.name.localeCompare(b.name));

const IconGrid = () => (
  <div className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-2 p-4">
    {icons.map((icon) => (
      <div
        className="flex flex-col items-center gap-y-2 rounded-lg border border-neutral-500/25 p-3"
        key={icon.path + icon.name}
        title={icon.path}
      >
        <div className="flex size-8 items-center justify-center [&>svg]:size-full">
          {icon.element}
        </div>
        <span className="text-center text-xs break-all">{icon.name}</span>
      </div>
    ))}
  </div>
);

const meta: Meta<typeof IconGrid> = {
  component: IconGrid,
  parameters: {
    layout: "fullscreen",
  },
  title: "Icons",
};

export default meta;
type Story = StoryObj<typeof IconGrid>;

export const AllIcons: Story = {};

export const AllIconsOnDarkSurface: Story = {
  render: () => (
    <div className="min-h-dvh bg-neutral-900 text-white">
      <IconGrid />
    </div>
  ),
};
