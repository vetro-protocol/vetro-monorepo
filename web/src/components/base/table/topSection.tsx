import type { ReactNode } from "react";

type Props = {
  children?: ReactNode;
  title: string;
};

export const TopSection = ({ children, title }: Props) => (
  <div className="flex w-full flex-col gap-3 border-b border-gray-200 bg-gray-100 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-16 md:py-6">
    <h4 className="text-base font-semibold tracking-tight text-gray-900">
      {title}
    </h4>
    {children}
  </div>
);
