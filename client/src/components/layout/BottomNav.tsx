import { NavLink } from "react-router-dom";
import { NAV } from "@/lib/nav";

export function BottomNav() {
  return (
    <nav
      className="tabbar md:hidden mx-3 mt-1 shrink-0"
      style={{ marginBottom: "max(0.75rem, env(safe-area-inset-bottom, 0.75rem))" }}
    >
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) => (isActive ? "on" : "")}
        >
          <item.icon size={21} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
