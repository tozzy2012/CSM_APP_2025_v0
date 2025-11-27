/**
 * API Client Configuration - Updated for network access
 * Configuração centralizada para chamadas à API Gateway
 */

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  // Ignore localhost env var to allow dynamic detection
  if (envUrl && envUrl !== "http://localhost:8000") {
    return envUrl;
  }
  // For non-localhost (e.g. network IP or Cloudflare domain), use relative path
  // This allows the Vite proxy to handle the request to the backend
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return "";
  }
  return "http://localhost:8000";
};

const API_BASE_URL = getApiBaseUrl();

console.log('🚀 API_BASE_URL configured as:', API_BASE_URL);
console.log('📦 import.meta.env.VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('🌐 Current hostname:', typeof window !== 'undefined' ? window.location.hostname : 'SSR');

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
        const sessionStr = localStorage.getItem("zapper_session_v2");
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
      // Handle 401 Unauthorized - Clear session and redirect to login
      if (response.status === 401) {
        console.warn("Unauthorized access - clearing session and redirecting to login");
        localStorage.removeItem("zapper_session_v2");
        // Only redirect if we are not already on the login page
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }

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

export interface Tenant {
  tenant_id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Tenant API methods
export const getTenant = async (tenantId: string): Promise<Tenant> => {
  return apiClient.get<Tenant>(`/api/v1/tenants/${tenantId}`);
};

export const getDefaultTenant = async (): Promise<Tenant> => {
  return apiClient.get<Tenant>(`/api/v1/tenants/default`);
};

export const updateTenant = async (tenantId: string, data: Partial<Tenant>): Promise<Tenant> => {
  return apiClient.put<Tenant>(`/api/v1/tenants/${tenantId}`, data);
};
