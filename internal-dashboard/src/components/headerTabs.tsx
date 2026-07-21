import { type ReactNode } from "react";
import { NavLink } from "react-router";

type Props = {
  children: ReactNode;
  to: string;
};

const Tab = ({ children, to }: Props) => (
  <NavLink
    className={({ isActive }) =>
      `rounded-md px-2 py-1 text-sm font-medium ${
        isActive
          ? "border border-solid border-neutral-300/55 bg-white text-neutral-950 shadow-xs"
          : "bg-neutral-100 text-neutral-600 hover:text-neutral-950"
      }`
    }
    to={to}
  >
    {children}
  </NavLink>
);

export const HeaderTabs = () => (
  <nav className="mb-12 flex items-center gap-x-2 border-y border-solid border-y-neutral-300/55 p-4">
    <Tab to="/dex">DEX</Tab>
    <Tab to="/hemi-earn">Hemi Earn</Tab>
  </nav>
);
