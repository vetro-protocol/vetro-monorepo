import { type ComponentProps } from "react";

type Props = Omit<ComponentProps<"a">, "rel" | "target">;

export const ExternalLink = ({ children, ...rest }: Props) => (
  <a {...rest} rel="noopener noreferrer" target="_blank">
    {children}
  </a>
);
