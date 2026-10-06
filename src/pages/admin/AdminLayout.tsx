import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useMinuitSkin } from "@/components/minuit/useMinuitSkin";
import AdminConsoleBar from "@/components/minuit/areas/admin/AdminConsoleBar";
import "@/components/minuit/areas/admin/admin.css";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, loading } = useAuth();
  useMinuitSkin("admin");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      navigate("/admin/tableau-de-bord", { replace: true });
    }
  }, [location.pathname, navigate]);

  if (loading) {
    return (
      <div className="adm-boot min-h-screen bg-background flex flex-col items-center justify-center gap-5">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="adm-boot-txt" aria-hidden="true">Salle de contrôle</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="adm-root min-h-screen flex flex-col bg-background">
      <Header />
      <SidebarProvider>
        <div className="flex w-full flex-1 pt-20">
          <AdminSidebar />
          {/* data-fx-off : la salle de contrôle a son propre mouvement, le kit hsb-fx ne découpe ni n'anime rien ici */}
          <div className="adm-col flex-1 flex flex-col min-w-0" data-fx-off="">
            <AdminConsoleBar>
              <SidebarTrigger className="adm-trigger h-11 w-11 shrink-0" />
            </AdminConsoleBar>
            <main className="adm-main flex-1 p-4 md:p-6 overflow-x-hidden">
              <div className="max-w-7xl mx-auto">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Footer />
    </div>
  );
};

export default AdminLayout;
