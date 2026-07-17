import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    // TEMP: allow preview for accounting testing
    if (!loading && (!user || !isAdmin) && !location.pathname.includes("/admin/comptabilite")) {
      navigate("/");
    }
  }, [user, isAdmin, loading, navigate, location.pathname]);

  useEffect(() => {
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      navigate("/admin/tableau-de-bord", { replace: true });
    }
  }, [location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <SidebarProvider>
        <div className="flex w-full flex-1 pt-20">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <div className="h-12 flex items-center border-b border-border/40 px-4 gap-2">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground">Administration</span>
            </div>
            <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
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
