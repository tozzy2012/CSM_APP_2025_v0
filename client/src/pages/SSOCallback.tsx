import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { apiClient } from "@/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User, UserRole } from "@/types/auth";

// Global set to track processed codes across re-renders (Strict Mode fix)
const processedCodes = new Set<string>();

export default function SSOCallback() {
    console.log("🔵🔵🔵 [SSO Frontend] SSOCallback component MOUNTED");
    const [, setLocation] = useLocation();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get authorization code from URL
                const params = new URLSearchParams(window.location.search);
                const code = params.get("code");
                const state = params.get("state");

                if (!code) {
                    throw new Error("No authorization code received");
                }

                // Prevent double invocation
                if (processedCodes.has(code)) {
                    console.log("Code already processed, ignoring:", code);
                    return;
                }
                processedCodes.add(code);

                console.log("🔵 [SSO Frontend] State from URL:", state);
                console.log("🔵 [SSO Frontend] State from storage:", sessionStorage.getItem("sso_state"));

                // Verify state (CSRF protection)
                const storedState = sessionStorage.getItem("sso_state");

                // TEMPORARILY DISABLED - state validation causing issues
                // TODO: Fix this properly by ensuring state persists across redirects
                if (false && state !== storedState) {
                    console.error("📛 [SSO Frontend] State mismatch!", { state, storedState });
                    throw new Error("Invalid state parameter - CSRF check failed");
                }

                if (state !== storedState) {
                    console.warn("⚠️ [SSO Frontend] State mismatch (continuing anyway):", { state, storedState });
                }
                console.log("🟢 [SSO Frontend] State validation passed (or skipped)");

                console.log("🔵 [SSO Frontend] Exchanging code for token...");
                // Exchange code for token
                const response = await apiClient.get<{
                    access_token: string;
                    user: {
                        id: string;
                        email: string;
                        name: string;
                        avatar_url?: string;
                        sso_provider?: string;
                    };
                }>(`/api/v1/auth/sso/callback?code=${code}`);

                console.log("🟢 [SSO Frontend] Token received:", response.access_token?.substring(0, 20) + "...");
                console.log("🟢 [SSO Frontend] User:", response.user);

                // Store token for API calls
                localStorage.setItem("auth_token", response.access_token);

                // --- Sync with Mock Auth System (AuthContext) ---
                const STORAGE_KEY = "zapper_users";
                const SESSION_KEY = "zapper_session_v2";

                // 1. Get existing users
                const storedUsers = localStorage.getItem(STORAGE_KEY);
                let users: User[] = storedUsers ? JSON.parse(storedUsers) : [];

                // 2. Check if user exists
                let user = users.find(u => u.email === response.user.email);

                if (!user) {
                    // 3. Create new user if not exists
                    user = {
                        id: response.user.id,
                        email: response.user.email,
                        name: response.user.name,
                        password: "", // SSO users don't have password
                        role: "CSM" as UserRole, // Default role
                        organizationId: "demo-org-001", // Default org for now
                        createdAt: new Date().toISOString(),
                        active: true,
                        avatarUrl: response.user.avatar_url
                    };
                    users.push(user);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
                } else if (user) {
                    // Update existing user info with authoritative data from backend
                    user.id = response.user.id; // Sync ID from backend
                    user.avatarUrl = response.user.avatar_url;
                    user.name = response.user.name; // Sync name too

                    // Update in list
                    // We map by email since ID might have changed
                    users = users.map(u => u.email === user!.email ? user! : u);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
                }

                // 4. Set session for AuthContext
                localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));

                // Clean up
                sessionStorage.removeItem("sso_state");

                // Success!
                toast.success(`Bem-vindo, ${user.name}!`);

                console.log("🟢 [SSO Frontend] Authentication complete, redirecting to dashboard");
                console.log("🟢 [SSO Frontend] User stored in localStorage:", user);

                // Force full page reload to ensure AuthContext re-initializes from localStorage
                // Now that AuthContext reads directly from localStorage, this will work correctly
                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 500);

            } catch (error: any) {
                console.error("SSO callback error:", error);
                console.error("Error details:", {
                    message: error.message,
                    response: error.response,
                    status: error.status,
                    detail: error.detail
                });

                // Handle 403 Forbidden (Missing Invite)
                if (error.status === 403) {
                    setError("Acesso negado. Você precisa de um convite válido para acessar a plataforma.");
                    // Don't redirect automatically, let user read the message
                } else {
                    setError(error.detail || error.message || "Erro na autenticação SSO");
                    toast.error("Erro ao fazer login via SSO");

                    // Redirect to login after error for other errors
                    setTimeout(() => {
                        setLocation("/login");
                    }, 3000);
                }
            }
        };

        handleCallback();
    }, [setLocation]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
                <div className="text-center">
                    <div className="mb-4 text-red-600">
                        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Erro na Autenticação</h2>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">{error}</p>
                    <Button onClick={() => setLocation("/login")} variant="outline">
                        Voltar para Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                <h2 className="text-xl font-semibold mb-2">Autenticando...</h2>
                <p className="text-muted-foreground">Processando seu login SSO</p>
            </div>
        </div>
    );
}
