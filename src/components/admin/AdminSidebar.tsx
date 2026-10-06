import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Scale,
  Euro,
  Users,
  Megaphone,
  Truck,
  Calculator,
  Shield,
  TrendingUp,
  Briefcase,
  UserRound,
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
import AdminSeal from "@/components/minuit/areas/admin/AdminSeal";

const items = [
  { title: "Tableau de bord", url: "/admin/tableau-de-bord", icon: LayoutDashboard },
  { title: "Commandes", url: "/admin/commandes", icon: Package },
  { title: "Clients", url: "/admin/clients", icon: UserRound },
  { title: "Produits", url: "/admin/produits", icon: Boxes },
  { title: "Inventaire", url: "/admin/inventaire", icon: Scale },
  { title: "Prix", url: "/admin/prix", icon: Euro },
  { title: "Rentabilité", url: "/admin/rentabilite", icon: TrendingUp },
  { title: "Pro & Facturation", url: "/admin/pro", icon: Users },
  { title: "Marketing", url: "/admin/marketing", icon: Megaphone },
  { title: "Logistique", url: "/admin/logistique", icon: Truck },
  { title: "Comptabilité", url: "/admin/comptabilite", icon: Calculator },
  { title: "Commerciaux", url: "/admin/commerciaux", icon: Briefcase },
  { title: "Espace Commercial", url: "/commercial", icon: Briefcase },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    // top-20 / h-auto : la barre commence sous l'en-tête fixe du site (80 px) au lieu de passer dessous
    <Sidebar collapsible="icon" className="adm-rail top-20 h-auto">
      <SidebarContent className="adm-side">
        <AdminSeal />
        <SidebarGroup>
          <SidebarGroupLabel className="adm-glabel flex items-center gap-2 text-gold">
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
                      <NavLink to={item.url} className="adm-link flex items-center gap-2">
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
