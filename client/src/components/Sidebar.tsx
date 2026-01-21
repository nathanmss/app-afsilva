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

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/loadings", label: "Loadings", icon: Package },
  { href: "/vehicles", label: "Vehicles", icon: Truck },
  { href: "/employees", label: "Employees", icon: Users },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logoutMutation, user } = useAuth();
  const [open, setOpen] = useState(false);

  const NavContent = () => (
    <div className="flex flex-col h-full py-4">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Truck className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight">FleetMgr</span>
      </div>

      <nav className="space-y-1 px-3 flex-1">
        {links.map((link) => {
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
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Signed in as</p>
          <p className="font-semibold truncate">{user?.name}</p>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
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
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">FleetMgr</span>
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
