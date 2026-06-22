import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { NAV } from "@/lib/nav";
import { Logo } from "@/components/Logo";
import { useAuthStore } from "@/store/auth";
import { initials } from "@/lib/utils";

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return (
    <aside className="sidebar hidden md:flex">
      <div className="flex items-center gap-3 mb-9 px-1">
        <Logo size={34} />
        <span className="screen-title text-[18px]">Lock-in</span>
      </div>

      <nav className="nav-d flex flex-col gap-1 flex-1">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => (isActive ? "on" : "")}>
            <item.icon size={19} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-3 px-1 pt-4 border-t border-border">
        <div className="w-9 h-9 rounded-full bg-surface-2 border border-border grid place-items-center font-mono text-[12px] text-accent shrink-0">
          {user ? initials(user.name) : "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium truncate">{user?.name}</p>
          <p className="text-[11px] text-muted-2 truncate">{user?.email}</p>
        </div>
        <button onClick={clearAuth} className="text-muted-2 hover:text-danger transition" aria-label="Log out">
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
}
