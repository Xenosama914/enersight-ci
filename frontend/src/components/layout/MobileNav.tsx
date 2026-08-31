import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { NAV_ITEMS, canAccess } from "@/components/layout/nav";

/** Bottom nav mobile, 5 entrees max (DESIGN.md section 8). */
export function MobileNav() {
  const role = useAuthStore((s) => s.user?.role);
  if (!role) return null;

  const items = NAV_ITEMS.filter((i) => i.mobile && canAccess(i, role)).slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-card md:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium",
              isActive ? "text-primary" : "text-muted-foreground",
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className="h-5 w-5" weight={isActive ? "fill" : "regular"} />
              <span className="truncate px-1">{item.label.split(" ")[0]}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
