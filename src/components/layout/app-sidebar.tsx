import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { navItems } from "@/lib/nav";
import { useAuth, canAccessMenu } from "@/lib/auth-store";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role } = useAuth();
  const visibleItems = role
    ? navItems.filter((item) => canAccessMenu(role, item.url))
    : [];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">
            M
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-semibold">MAQIL.ERP</div>
            <div className="truncate text-xs text-muted-foreground">
              Internal ERP
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                if (item.children && item.children.length > 0) {
                  return (
                    <CollapsibleNavItem
                      key={item.url}
                      item={item}
                      pathname={pathname}
                    />
                  );
                }
                const active =
                  pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function CollapsibleNavItem({
  item,
  pathname,
}: {
  item: (typeof navItems)[number];
  pathname: string;
}) {
  const parentActive =
    pathname === item.url || pathname.startsWith(item.url + "/");
  const [open, setOpen] = useState(parentActive);

  useEffect(() => {
    setOpen(parentActive);
  }, [parentActive]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            isActive={parentActive}
            tooltip={item.title}
            className="group/collapsible"
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 data-[state=open]:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children?.map((child) => {
              const active = pathname === child.url;
              return (
                <SidebarMenuSubItem key={child.url}>
                  <SidebarMenuSubButton asChild isActive={active}>
                    <Link to={child.url}>
                      <child.icon className="h-3.5 w-3.5" />
                      <span>{child.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
