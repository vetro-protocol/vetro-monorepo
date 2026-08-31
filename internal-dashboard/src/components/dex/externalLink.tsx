import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className: string;
  href: string;
};

export const ExternalLink = ({ children, className, href }: Props) => (
  <a
    className={className}
    href={href}
    rel="noopener noreferrer"
    target="_blank"
  >
    {children}
  </a>
);
