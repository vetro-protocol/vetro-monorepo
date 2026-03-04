import type { ReactNode } from "react";

const variants = {
  blue: "bg-blue-500 text-white",
  gray: "bg-gray-50 text-gray-600 shadow-bs",
} as const;

type Props = {
  children: ReactNode;
  variant?: keyof typeof variants;
};

export const Badge = ({ children, variant = "gray" }: Props) => (
  <span
    className={`text-caption inline-flex h-4 items-center justify-center rounded-md px-1.5 ${variants[variant]}`}
  >
    {children}
  </span>
);
