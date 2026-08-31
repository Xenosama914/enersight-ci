import { NavLink } from "react-router-dom";
import { CaretLeft, Lightning } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useAppStore } from "@/stores/appStore";
import { NAV_ITEMS, canAccess } from "@/components/layout/nav";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const role = useAuthStore((s) => s.user?.role);
  const org = useAuthStore((s) => s.organization);
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggle = useAppStore((s) => s.toggleSidebar);

  if (!role) return null;
  const items = NAV_ITEMS.filter((i) => canAccess(i, role));

  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r bg-card md:flex md:flex-col",
        collapsed ? "w-16" : "w-[220px]",
      )}
    >
      <div className={cn("flex h-14 items-center gap-2 border-b px-4", collapsed && "justify-center px-0")}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary">
          <Lightning className="h-4 w-4 text-primary-foreground" weight="fill" />
        </span>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight text-foreground">
            EnerSight <span className="text-gold-strong">CI</span>
          </span>
        )}
      </div>

      {!collapsed && (
        <div className="border-b px-4 py-3">
          <p className="text-xs text-muted-foreground">Organisation</p>
          <p className="truncate text-sm font-medium text-foreground">{org?.name}</p>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="h-4 w-4 shrink-0" weight={isActive ? "fill" : "regular"} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className={cn("w-full justify-start gap-3 text-muted-foreground", collapsed && "justify-center")}
        >
          <CaretLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Reduire</span>}
        </Button>
      </div>
    </aside>
  );
}
