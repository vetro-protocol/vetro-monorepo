const alignClasses = {
  center: "text-center",
  left: "text-left",
};

export const Header = ({
  align = "left",
  text,
}: {
  align?: "center" | "left";
  text: string;
}) => (
  <span
    className={`text-b-medium block py-3 ${alignClasses[align]} text-gray-500`}
  >
    {text}
  </span>
);
