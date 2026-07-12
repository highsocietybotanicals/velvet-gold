import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Euro,
  Users,
  Megaphone,
  Truck,
  Calculator,
  Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Tableau de bord", url: "/admin/tableau-de-bord", icon: LayoutDashboard },
  { title: "Commandes", url: "/admin/commandes", icon: Package },
  { title: "Produits", url: "/admin/produits", icon: Boxes },
  { title: "Prix", url: "/admin/prix", icon: Euro },
  { title: "Pro & Facturation", url: "/admin/pro", icon: Users },
  { title: "Marketing", url: "/admin/marketing", icon: Megaphone },
  { title: "Logistique", url: "/admin/logistique", icon: Truck },
  { title: "Comptabilité", url: "/admin/comptabilite", icon: Calculator },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-gold">
            <Shield className="h-4 w-4" />
            {!collapsed && <span>Administration</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={item.url} className="flex items-center gap-2 hover:bg-muted/50">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
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
