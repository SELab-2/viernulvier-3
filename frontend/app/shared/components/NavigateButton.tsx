import { NavLink } from "react-router";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";

export default function NavifateButton({
  location,
  name,
  variant = "primary",
}: {
  location: string;
  name: string;
  variant?: "primary" | "secondary";
}) {
  const lp = useLocalizedPath();

  const base =
    "px-8 md:px-10 py-4 rounded-full text-xs md:text-sm font-bold uppercase tracking-[0.2em] transition-all inline-block hover:scale-105 shadow-xl shadow-archive-ink/10";

  const styles = {
    primary: "bg-archive-ink text-archive-paper",
    secondary: "border border-archive-ink/20",
  };

  return (
    <NavLink
      to={lp(location)}
      data-testid={`home-button-${name}`}
      className={`${base} ${styles[variant]}`}
    >
      {name}
    </NavLink>
  );
}
