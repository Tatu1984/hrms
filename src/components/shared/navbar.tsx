'use client';

import { Bell, LogOut, Menu, PanelLeft, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

interface NavItem {
  label?: string;
  href?: string;
  children?: NavItem[];
  heading?: string;
}

interface NavbarProps {
  userName: string;
  userRole: string;
  items?: NavItem[];
  onMenuClick?: () => void;
  onCollapseToggle?: () => void;
}

function titleize(segment: string) {
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function resolveTitle(items: NavItem[] | undefined, pathname: string): string {
  if (items) {
    for (const item of items) {
      if (item.href === pathname && item.label) return item.label;
      for (const child of item.children ?? []) {
        if (child.href === pathname && child.label) return child.label;
      }
    }
  }
  const segment = pathname.split('/').filter(Boolean).pop();
  return segment ? titleize(segment) : 'Dashboard';
}

export default function Navbar({
  userName,
  userRole,
  items,
  onMenuClick,
  onCollapseToggle,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const title = resolveTitle(items, pathname);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3 md:px-6">
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      {/* Desktop collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        onClick={onCollapseToggle}
        aria-label="Toggle sidebar"
      >
        <PanelLeft className="size-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[15px] font-semibold text-foreground">
          {title}
        </h1>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">
          Welcome back, {userName}
        </p>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden gap-2 text-muted-foreground sm:inline-flex"
        >
          <Search className="size-4" />
          <span className="hidden lg:inline">Search</span>
        </Button>

        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-full p-0.5 pr-2 outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
              aria-label="Account menu"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {userName.charAt(0).toUpperCase()}
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-medium">{userName}</span>
                <span className="block text-xs text-muted-foreground">
                  {userRole}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{userName}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {userRole}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
