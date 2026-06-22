import { NavLink } from "react-router-dom";
import { NAV } from "@/lib/nav";

export function BottomNav() {
  return (
    <nav className="tabbar md:hidden fixed left-3 right-3 bottom-3 z-40">
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
