import { useNavigate } from "react-router-dom";
import { Bell, Lightning, Question, SignOut, List } from "@phosphor-icons/react";
import { useAuthStore } from "@/stores/authStore";
import { useAppStore } from "@/stores/appStore";
import { ROLE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function TopBar({ title }: { title: string }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleSidebar}
        aria-label="Menu"
      >
        <List className="h-5 w-5" />
      </Button>

      <span className="flex h-6 w-6 items-center justify-center rounded bg-primary md:hidden">
        <Lightning className="h-3.5 w-3.5 text-primary-foreground" weight="fill" />
      </span>

      <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="icon" aria-label="Aide" className="hidden sm:inline-flex">
          <Question className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Avatar>
                <AvatarFallback>{user ? initials(user.full_name) : "?"}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{user?.full_name}</p>
                <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <div className="px-2 pb-1.5">
              {user && (
                <Badge variant="secondary" className="font-normal">
                  {ROLE_LABELS[user.role]}
                </Badge>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              Parametres
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="text-destructive focus:text-destructive"
            >
              <SignOut className="h-4 w-4" />
              Se deconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
