import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PlaybooksProvider } from "./contexts/PlaybooksContext";
import { AccountsProvider } from "./contexts/AccountsContext";
import { TeamProvider } from "./contexts/TeamContext";
import { ActivitiesProvider } from "./contexts/ActivitiesContext";
import { TasksProvider } from "./contexts/TasksContext";
import { TagsProvider } from "./contexts/TagsContext";
import { ClientsProvider } from "./contexts/ClientsContext";
import { HealthScoreProvider } from "./contexts/HealthScoreContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SSOCallback from "./pages/SSOCallback";
import Admin from "./pages/Admin";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import Dashboard from "./pages/Dashboard";
import AccountDetails from "./pages/AccountDetails";
import Accounts from "./pages/Accounts";
import Tasks from "./pages/Tasks";
import Activities from "./pages/Activities";
import Playbooks from "./pages/Playbooks";
import PlaybookEditor from "./pages/PlaybookEditor";
import PlaybookView from "./pages/PlaybookView";
import Settings from "./pages/Settings";
import Team from "./pages/Team";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { UserRole } from "./types/auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/auth/callback" component={SSOCallback} />
      <Route
        path="/admin"
        component={() => (
          <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
            <DashboardLayout hideHealthScoreButton>
              <Admin />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />

      <Route
        path="/team"
        component={() => (
          <ProtectedRoute>
            <DashboardLayout>
              <Team />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/dashboard"
        component={() => (
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/accounts"
        component={() => (
          <ProtectedRoute>
            <DashboardLayout>
              <Accounts />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/accounts/:id"
        component={() => (
          <ProtectedRoute>
            <DashboardLayout>
              <AccountDetails />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/clients"
        component={() => (
          <ProtectedRoute>
            <DashboardLayout>
              <Clients />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/clients/:id"
        component={() => (
          <ProtectedRoute>
            <DashboardLayout>
              <ClientDetails />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/tasks"
        component={() => (
          <ProtectedRoute>
            <DashboardLayout>
              <Tasks />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/activities"
        component={() => (
          <ProtectedRoute>
            <DashboardLayout>
              <Activities />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/playbooks/new"
        component={() => (
          <ProtectedRoute>
            <DashboardLayout>
              <PlaybookEditor />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/playbooks/:id/edit"
        component={({ params }) => (
          <ProtectedRoute>
            <DashboardLayout>
              <PlaybookEditor id={params.id} />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/playbooks/:id"
        component={({ params }) => (
          <ProtectedRoute>
            <DashboardLayout>
              <PlaybookView id={params.id} />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/playbooks"
        component={() => (
          <ProtectedRoute>
            <DashboardLayout>
              <Playbooks />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/settings"
        component={() => (
          <ProtectedRoute>
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route path="/404" component={NotFound} />
      {/* fallback final */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      // switchable
      >
        <TooltipProvider>
          <Toaster />
          <AuthProvider>
            <TagsProvider>
              <ClientsProvider>
                <HealthScoreProvider>
                  <PlaybooksProvider>
                    <AccountsProvider>
                      <TeamProvider>
                        <ActivitiesProvider>
                          <TasksProvider>
                            <Router />
                          </TasksProvider>
                        </ActivitiesProvider>
                      </TeamProvider>
                    </AccountsProvider>
                  </PlaybooksProvider>
                </HealthScoreProvider>
              </ClientsProvider>
            </TagsProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
