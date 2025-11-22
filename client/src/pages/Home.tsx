import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Users, Zap } from "lucide-react";
import { APP_TITLE } from "@/const";
import { Link } from "wouter";

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="p-6">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{APP_TITLE}</h1>
          <Link href="/dashboard">
            <Button variant="outline">Login</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Customer Success Platform
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Plataforma completa de Customer Success com IA proativa, health scores automáticos e insights acionáveis.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-6">
                Acessar Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
            <div className="bg-card p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Health Scores</h3>
              <p className="text-muted-foreground">
                Monitore a saúde dos clientes com scorecards configuráveis e alertas automáticos.
              </p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">IA Proativa</h3>
              <p className="text-muted-foreground">
                Previsão de churn, detecção de oportunidades e recomendações de próximas ações.
              </p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Customer 360</h3>
              <p className="text-muted-foreground">
                Visão completa do cliente com timeline de atividades, métricas e insights.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-6 border-t border-border">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © 2024 {APP_TITLE}. Powered by Zapper CS Platform.
        </div>
      </footer>
    </div>
  );
}
