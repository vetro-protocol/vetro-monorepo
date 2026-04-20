import type { ReactNode } from "react";

const variants = {
  blue: "bg-blue-500 text-white",
  gray: "bg-gray-50 text-gray-600 shadow-bs",
  green: "bg-emerald-100 text-emerald-500",
  "light-red": "bg-rose-50 text-rose-500",
  red: "bg-rose-500 text-white",
} as const;

const hoverVariants = {
  blue: "hover:bg-blue-600",
  gray: "hover:bg-gray-100 hover:text-gray-900",
  green: "hover:bg-emerald-200",
  "light-red": "hover:bg-rose-100",
  red: "hover:bg-rose-600",
} as const;

type Props = {
  children: ReactNode;
  hoverable?: boolean;
  variant?: keyof typeof variants;
};

export const Badge = ({
  children,
  hoverable = false,
  variant = "gray",
}: Props) => (
  <span
    className={`text-caption inline-flex h-4 items-center justify-center rounded-md px-1.5 ${variants[variant]} ${hoverable ? `cursor-pointer ${hoverVariants[variant]}` : ""}`}
  >
    {children}
  </span>
);
