import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { apiClient } from "@/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { User, UserRole } from "@/types/auth";

// Global set to track processed codes across re-renders (Strict Mode fix)
const processedCodes = new Set<string>();

export default function SSOCallback() {
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

                // Verify state (CSRF protection)
                const storedState = sessionStorage.getItem("sso_state");
                if (state !== storedState) {
                    throw new Error("Invalid state parameter");
                }

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

                // Store token for API calls
                localStorage.setItem("auth_token", response.access_token);

                // --- Sync with Mock Auth System (AuthContext) ---
                const STORAGE_KEY = "zapper_users";
                const SESSION_KEY = "zapper_session";

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
                    // Update existing user info
                    user.avatarUrl = response.user.avatar_url;
                    // Update in list
                    users = users.map(u => u.id === user!.id ? user! : u);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
                }

                // 4. Set session for AuthContext
                localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));

                // Clean up
                sessionStorage.removeItem("sso_state");

                // Success!
                toast.success(`Bem-vindo, ${user.name}!`);

                // Redirect to dashboard
                // Small delay to allow localStorage to settle and AuthContext to pick it up on reload/redirect
                setTimeout(() => {
                    // Force a reload to ensure AuthContext re-initializes from localStorage
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
                setError(error.detail || error.message || "Erro na autenticação SSO");
                toast.error("Erro ao fazer login via SSO");

                // Redirect to login after error
                setTimeout(() => {
                    setLocation("/login");
                }, 3000);
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
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <p className="text-sm text-muted-foreground">Redirecionando para login...</p>
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
