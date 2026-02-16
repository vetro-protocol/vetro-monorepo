import type { ReactNode } from "react";

const WithdrawnIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none">
    <path
      fill="#99A1AF"
      fillRule="evenodd"
      d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.15-.043l4.251-5.5Z"
      clipRule="evenodd"
    />
  </svg>
);

const ReadyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none">
    <path
      fill="#416BFF"
      d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14Zm0-1.4A5.6 5.6 0 1 0 8 2.4a5.6 5.6 0 0 0 0 11.2Zm0-2.1a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"
    />
  </svg>
);

const CooldownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none">
    <path
      fill="#FE9A00"
      d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8Zm12.6 0A5.6 5.6 0 1 1 2.4 8a5.6 5.6 0 0 1 11.2 0Zm-1.4 0A4.2 4.2 0 0 1 8 12.2V3.8A4.2 4.2 0 0 1 12.2 8Z"
    />
  </svg>
);

const icons = {
  cooldown: CooldownIcon,
  ready: ReadyIcon,
  withdrawn: WithdrawnIcon,
} as const;

const textClasses = {
  cooldown: "text-gray-900",
  ready: "text-gray-900",
  withdrawn: "text-gray-500",
} as const;

export type StatusBadgeVariant = keyof typeof icons;

type Props = {
  children: ReactNode;
  variant: StatusBadgeVariant;
};

export function StatusBadge({ children, variant }: Props) {
  const Icon = icons[variant];
  return (
    <div className="flex items-center gap-2">
      <Icon />
      <span className={`text-xsm font-medium ${textClasses[variant]}`}>
        {children}
      </span>
    </div>
  );
}
