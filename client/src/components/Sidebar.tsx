import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Wallet, 
  FileText, 
  Users, 
  Truck, 
  Package, 
  LogOut,
  Menu,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { USER_ROLES } from "@shared/schema";

const links = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/finance", label: "Financeiro", icon: Wallet },
  { href: "/invoices", label: "Notas Fiscais", icon: FileText },
  { href: "/loadings", label: "Cargas", icon: Package },
  { href: "/vehicles", label: "Veículos", icon: Truck },
  { href: "/employees", label: "Funcionários", icon: Users },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logoutMutation, user } = useAuth();
  const [open, setOpen] = useState(false);
  
  const visibleLinks =
    user?.role === USER_ROLES.OPERATOR
      ? links.filter((link) => link.href === "/loadings")
      : links;

  const NavContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="px-6 py-6 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-sm flex-shrink-0 flex items-center justify-center">
          <img src="/favicon.jpg" alt="AF Silva Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-lg tracking-tight leading-tight">AF Silva</span>
          <span className="text-xs text-sidebar-foreground/70 font-medium tracking-widest uppercase">Transportes</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
          Menu Operacional
        </div>
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div 
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer border",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary/50 shadow-md shadow-sidebar-primary/20" 
                    : "border-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-5 h-5", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground")} />
                  {link.label}
                </div>
                {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border mt-auto bg-sidebar-accent/30">
        <div className="bg-sidebar-accent border border-sidebar-border rounded-xl p-3 mb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sidebar-primary/20 text-sidebar-primary flex items-center justify-center font-bold">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate text-sidebar-accent-foreground">{user?.name}</p>
            <p className="text-[10px] text-sidebar-foreground/60 font-medium uppercase tracking-wider truncate">
              {user?.role === USER_ROLES.ADMIN ? "Administrador" : "Operador"}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-center bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Encerrar Sessão
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 fixed inset-y-0 z-30 shadow-2xl shadow-black/10">
        <NavContent />
      </aside>

      {/* Mobile Trigger Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border p-4 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center">
              <img src="/favicon.jpg" alt="AF Silva Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-lg text-sidebar-foreground">AF Silva</span>
         </div>
         <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] border-sidebar-border">
              <NavContent />
            </SheetContent>
         </Sheet>
      </div>

      {/* Spacer for mobile header */}
      <div className="h-16 lg:hidden" />
    </>
  );
}
