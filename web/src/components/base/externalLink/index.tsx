import { type ComponentProps } from "react";

type Props = Omit<ComponentProps<"a">, "rel" | "target">;

export const inlineLinkClassName =
  "font-medium text-blue-500 transition-colors hover:text-blue-600";

export const ExternalLink = ({ children, ...rest }: Props) => (
  <a {...rest} rel="noopener noreferrer" target="_blank">
    {children}
  </a>
);
