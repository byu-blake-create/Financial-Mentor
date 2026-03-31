import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  PieChart, 
  BookOpen, 
  MessageSquare, 
  LogOut,
  UserCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Budget", href: "/budget", icon: PieChart },
  { name: "Modules", href: "/modules", icon: BookOpen },
  { name: "Chat Expert", href: "/chat", icon: MessageSquare },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen w-72 flex-col border-r bg-card shadow-sm hidden md:flex fixed left-0 top-0">
      <div className="flex h-20 items-center px-8 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <PieChart className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground font-display">
            Prosper AI
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-4 mt-4">
          Menu
        </div>
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t bg-muted/20">
        <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm border">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="User" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <UserCircle className="h-6 w-6" />
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.firstName || 'User'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email || 'user@example.com'}
            </p>
          </div>
          <button 
            onClick={() => logout()}
            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function MobileHeader() {
  const [location] = useLocation();
  const activePage = navigation.find(n => n.href === location)?.name || "Prosper AI";

  return (
    <div className="md:hidden flex h-16 items-center justify-between border-b px-4 bg-background sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <PieChart className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold text-lg font-display">{activePage}</span>
      </div>
      {/* Mobile menu trigger would go here - for now simplified */}
    </div>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50 pb-safe">
      <div className="flex justify-around p-3">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
