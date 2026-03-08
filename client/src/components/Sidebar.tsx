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
  X
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
    <div className="flex flex-col h-full py-4">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white p-1">
          <img src="/favicon.png" alt="AF Silva Logo" className="w-full h-full object-contain" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight">AF Silva Transportes</span>
      </div>

      <nav className="space-y-1 px-3 flex-1">
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div 
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 mt-auto">
        <div className="bg-card border border-border/50 rounded-xl p-4 mb-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
            {user?.role === USER_ROLES.ADMIN ? "Administrador" : "Operador"}
          </p>
          <p className="font-semibold truncate">{user?.name}</p>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair do Sistema
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-sm fixed inset-y-0 z-30">
        <NavContent />
      </aside>

      {/* Mobile Trigger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white p-0.5">
              <img src="/favicon.png" alt="AF Silva Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-lg">AF Silva Transportes</span>
         </div>
         <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <NavContent />
            </SheetContent>
         </Sheet>
      </div>

      {/* Spacer for mobile header */}
      <div className="h-16 lg:hidden" />
    </>
  );
}
