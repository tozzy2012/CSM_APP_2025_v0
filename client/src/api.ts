/**
 * API Client Configuration
 * Configuração centralizada para chamadas à API Gateway
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface ApiError {
  message: string;
  status: number;
  detail?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    } else {
      // Fallback for Dev/Mock Auth: Inject X-User-ID from localStorage session
      try {
        const sessionStr = localStorage.getItem("zapper_session");
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          if (session.userId) {
            headers["X-User-ID"] = session.userId;
          }
        } else {
          // Ultimate fallback for dev: use default super admin ID if no session exists
          // This prevents 401s if localStorage is cleared or during hot reloads
          headers["X-User-ID"] = "super-admin-001";
        }
      } catch (e) {
        console.warn("Failed to load session for auth header", e);
        headers["X-User-ID"] = "super-admin-001";
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = {
        message: response.statusText,
        status: response.status,
      };

      try {
        const errorData = await response.json();
        error.detail = errorData.detail || errorData.message;
      } catch {
        // Ignore JSON parse errors
      }

      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  // POST request
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Tipos de dados da API
export interface Account {
  account_id: string;
  tenant_id: string;
  name: string;
  domain?: string;
  industry?: string;
  company_size?: string;
  lifecycle_stage: string;
  csm_owner_id?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface HealthScore {
  score_id: string;
  account_id: string;
  score_value: number;
  status: "green" | "yellow" | "red";
  component_scores?: Record<string, unknown>;
  calculated_at: string;
}

export interface Activity {
  activity_id: string;
  account_id: string;
  activity_type: "note" | "call" | "meeting" | "email" | "system";
  subject?: string;
  description?: string;
  activity_date: string;
  created_by_user_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Task {
  task_id: string;
  account_id?: string;
  title: string;
  description?: string;
  assigned_to_user_id: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NBARecommendation {
  recommendation_id: string;
  account_id: string;
  action_type: string;
  priority: "low" | "medium" | "high" | "urgent";
  reasoning: string;
  status: "pending" | "accepted" | "dismissed" | "completed";
  recommended_at: string;
}
