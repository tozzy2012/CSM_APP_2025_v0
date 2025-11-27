/**
 * Dashboard Layout Component
 * Layout principal com sidebar e header
 */
import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Activity,
  BookOpen,
  Settings,
  LogOut,
  Building2,
  Key,
  ChevronDown,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useUsers } from "@/hooks/useUsers";
import { useTheme } from "@/contexts/ThemeContext";
import { APP_TITLE } from "@/const";
import HealthScoreButton from "@/components/HealthScoreButton";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  hideHealthScoreButton?: boolean;
}

interface NavItem {
  path: string;
  label: string;
  icon: any;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/clients", label: "Clientes", icon: Building2 },
  {
    path: "/accounts",
    label: "Accounts",
    icon: Users,
    children: [
      { path: "/tasks", label: "Tasks", icon: CheckSquare },
      { path: "/activities", label: "Activities", icon: Activity },
    ]
  },
  { path: "/playbooks", label: "Playbooks", icon: BookOpen },
  { path: "/settings", label: "Settings", icon: Settings },
];

// NavMenuItem Component with collapsible functionality
function NavMenuItem({ item, location }: { item: NavItem; location: string }) {
  const [isOpen, setIsOpen] = useState(true);
  const Icon = item.icon;
  const isActive = location === item.path || location.startsWith(item.path + "/");
  const hasActiveChild = item.children?.some(child =>
    location === child.path || location.startsWith(child.path + "/")
  );

  // If item has children, render collapsible menu
  if (item.children) {
    return (
      <div className="space-y-1">
        <div className="flex items-center">
          <Link href={item.path} className="flex-1">
            <a
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                ? "bg-primary text-primary-foreground"
                : hasActiveChild
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium flex-1">{item.label}</span>
            </a>
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 mr-2 rounded-md transition-all duration-200 ${hasActiveChild || isActive
              ? "text-primary-foreground hover:bg-primary/90"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            aria-label={isOpen ? "Retrair submenu" : "Expandir submenu"}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                }`}
            />
          </button>
        </div>

        {/* Collapsible submenu with smooth animation */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
        >
          <div className="ml-4 pl-4 border-l-2 border-border space-y-1 py-1">
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              const isChildActive = location === child.path || location.startsWith(child.path + "/");

              return (
                <Link key={child.path} href={child.path}>
                  <a
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${isChildActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1"
                      }`}
                  >
                    <ChildIcon className="w-4 h-4" />
                    <span className="font-medium text-sm">{child.label}</span>
                  </a>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Regular menu item without children
  return (
    <Link href={item.path}>
      <a
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{item.label}</span>
      </a>
    </Link>
  );
}

export default function DashboardLayout({ children, hideHealthScoreButton = false }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const { logout, currentUser, currentOrganization } = useAuth();
  const { changePassword } = useUsers();
  const { theme, toggleTheme } = useTheme();

  // Nome da plataforma baseado na organização atual
  const platformName = currentOrganization?.name || APP_TITLE;

  // Modal de alterar senha
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    // Verificar senha atual
    if (currentUser?.password !== currentPassword) {
      toast.error("Senha atual incorreta");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (currentUser?.id) {
      changePassword(currentUser.id, newPassword);
      toast.success("Senha alterada com sucesso!");
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border flex justify-center">
          <Link href="/dashboard">
            <a className="block hover:opacity-90 transition-opacity">
              <img
                src="/logo.png"
                alt={platformName}
                className="h-12 w-auto object-contain"
              />
            </a>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavMenuItem key={item.path} item={item} location={location} />
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={toggleTheme}
          >
            {theme === "dark" ? "🌞" : "🌙"} Toggle Theme
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setShowChangePassword(true)}
          >
            <Key className="w-5 h-5 mr-3" />
            Alterar Senha
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-foreground">
              {navItems.find((item) => location.startsWith(item.path))?.label || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {currentUser?.name || "Usuário"}
              {currentUser?.role === UserRole.SUPER_ADMIN && (
                <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">ADMIN</span>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>

      {/* Health Score Floating Button */}
      {!hideHealthScoreButton && <HealthScoreButton variant="floating" />}

      {/* Modal Alterar Senha */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Minha Senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Senha Atual</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
              />
            </div>
            <div>
              <Label>Nova Senha</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <Label>Confirmar Nova Senha</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePassword(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword}>Alterar Senha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
