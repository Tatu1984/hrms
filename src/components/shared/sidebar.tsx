'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarItem {
  icon: string;
  label: string;
  href: string;
  children?: SidebarItem[];
}

interface SidebarProps {
  items: SidebarItem[];
  /** Desktop icon-only mode */
  collapsed?: boolean;
  /** Called after a navigation link is clicked (used to close the mobile drawer) */
  onNavigate?: () => void;
}

function getIcon(name: string) {
  return (Icons as unknown as Record<string, Icons.LucideIcon>)[name];
}

export default function Sidebar({
  items,
  collapsed = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>([]);

  // Auto-expand the parent group that contains the active route.
  useEffect(() => {
    const activeParents = items
      .filter((item) =>
        item.children?.some(
          (child) =>
            pathname === child.href || pathname.startsWith(child.href + '/'),
        ),
      )
      .map((item) => item.href);
    if (activeParents.length) {
      setExpanded((prev) => Array.from(new Set([...prev, ...activeParents])));
    }
  }, [pathname, items]);

  const toggleExpand = (href: string) => {
    setExpanded((prev) =>
      prev.includes(href)
        ? prev.filter((h) => h !== href)
        : [...prev, href],
    );
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const linkBase =
    'group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors';
  const linkActive =
    'bg-sidebar-accent text-sidebar-accent-foreground font-medium';
  const linkIdle =
    'font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground';

  const renderLink = (
    item: SidebarItem,
    opts: { active: boolean; level: number },
  ) => {
    const IconComponent = getIcon(item.icon);
    const content = (
      <>
        {IconComponent && <IconComponent className="size-4 shrink-0" />}
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      </>
    );

    const link = (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          linkBase,
          opts.active ? linkActive : linkIdle,
          collapsed && 'justify-center px-2',
        )}
        style={
          !collapsed && opts.level > 0
            ? { paddingLeft: `${0.75 + opts.level * 0.75}rem` }
            : undefined
        }
      >
        {content}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return link;
  };

  const renderItem = (item: SidebarItem, level = 0) => {
    const hasChildren = !!item.children?.length;
    const active = isActive(item.href);
    const isExpanded = expanded.includes(item.href);

    if (!hasChildren || collapsed) {
      return <div key={item.href}>{renderLink(item, { active, level })}</div>;
    }

    return (
      <div key={item.href}>
        <div className="flex items-center gap-1">
          <Link
            href={item.href}
            onClick={onNavigate}
            className={cn(linkBase, 'flex-1', active ? linkActive : linkIdle)}
          >
            {(() => {
              const IconComponent = getIcon(item.icon);
              return IconComponent ? (
                <IconComponent className="size-4 shrink-0" />
              ) : null;
            })()}
            <span className="flex-1 truncate">{item.label}</span>
          </Link>
          <button
            type="button"
            onClick={() => toggleExpand(item.href)}
            aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
            aria-expanded={isExpanded}
            className={cn(
              'rounded-lg p-2 transition-colors',
              'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )}
          >
            <ChevronDown
              className={cn(
                'size-4 transition-transform',
                isExpanded && 'rotate-180',
              )}
            />
          </button>
        </div>

        {isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div
        className={cn(
          'flex h-14 items-center border-b border-sidebar-border px-4',
          collapsed && 'justify-center px-2',
        )}
      >
        <Link
          href="#"
          onClick={(e) => e.preventDefault()}
          className="flex items-center gap-2.5"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Icons.Hexagon className="size-5" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-semibold">HRMS</p>
              <p className="text-xs text-sidebar-foreground/60">
                Management System
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {items.map((item) => renderItem(item))}
      </nav>
    </div>
  );
}
