/**
 * Login Page with WorkOS SSO
 * Página de autenticação com Google/Microsoft SSO
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/api";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  const handleSSOLogin = async (provider: string) => {
    try {
      setIsLoading(true);

      // Get authorization URL from backend
      const response = await apiClient.post<{ authorization_url: string, state: string }>(
        "/api/v1/auth/sso/authorize",
        { provider }
      );

      // Store state for verification
      sessionStorage.setItem("sso_state", response.state);

      // Redirect to WorkOS
      window.location.href = response.authorization_url;
    } catch (error: any) {
      console.error("SSO error:", error);
      toast.error("Erro ao iniciar login SSO");
      setIsLoading(false);
    }
  };

  // Invite handling
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteStatus, setInviteStatus] = useState<{ valid: boolean; message?: string }>({ valid: false });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite");
    if (token) {
      setInviteToken(token);
      validateInvite(token);
    }
  }, []);

  const validateInvite = async (token: string) => {
    try {
      const invite = await apiClient.get<{ role: string }>(`/api/v1/invites/validate/${token}`);
      setInviteStatus({
        valid: true,
        message: `Convite válido! Faça login para aceitar o convite de ${invite.role}.`
      });
      toast.success("Convite verificado com sucesso!");
    } catch (error: any) {
      console.error("Invalid invite:", error);
      const msg = error.detail || "Convite inválido ou expirado";
      setInviteStatus({ valid: false, message: msg });
      toast.error(msg);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const success = login(email, password);
      if (success) {
        toast.success("Login realizado com sucesso!");
        setLocation("/dashboard");
      } else {
        setError("Email ou senha incorretos");
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-xl inline-block">
              <img
                src="/logo.png?v=6"
                alt="Zapper CS Platform"
                className="h-48 w-auto object-contain"
              />
            </div>
          </div>
          <CardDescription className="text-center">
            Entre com suas credenciais ou use SSO
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {inviteToken && (
            <Alert variant={inviteStatus.valid ? "default" : "destructive"} className="mb-6 border-primary/50 bg-primary/5">
              <Mail className="h-4 h-4" />
              <AlertDescription>
                {inviteStatus.message || "Verificando convite..."}
              </AlertDescription>
            </Alert>
          )}

          {/* SSO Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleSSOLogin("GoogleOAuth")}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Login com Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleSSOLogin("MicrosoftOAuth")}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23">
                <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              Login com Microsoft
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou continue com email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email ou Login</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  placeholder="admin ou seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-semibold mb-2">Credenciais de teste:</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><strong>Super Admin:</strong> admin / adminadmin</p>
              <p><strong>Demo Admin:</strong> demo@admin.com / demo123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
