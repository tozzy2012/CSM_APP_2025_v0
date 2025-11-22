import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";
import { parse as parseCookieHeader } from "cookie";
import { ForbiddenError } from "@shared/_core/errors";
import type { AppUser } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  userId: number;
  email: string;
  organizationId: number | null;
  role: "super_admin" | "org_admin" | "csm";
};

class AuthService {
  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  /**
   * Hash password with bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Create session token for authenticated user
   */
  async createSessionToken(
    user: AppUser,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const payload: SessionPayload = {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    };

    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  /**
   * Verify session token
   */
  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) {
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });

      const { userId, email, organizationId, role } = payload as Record<
        string,
        unknown
      >;

      if (
        typeof userId !== "number" ||
        !isNonEmptyString(email) ||
        !isNonEmptyString(role)
      ) {
        return null;
      }

      return {
        userId,
        email,
        organizationId: organizationId as number | null,
        role: role as "super_admin" | "org_admin" | "csm",
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  /**
   * Authenticate request and return user
   */
  async authenticateRequest(req: Request): Promise<AppUser> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const user = await db.getUserById(session.userId);

    if (!user) {
      throw ForbiddenError("User not found");
    }

    return user;
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AppUser | null> {
    const user = await db.getUserByEmail(email);

    if (!user) {
      return null;
    }

    const isValid = await this.verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return null;
    }

    return user;
  }
}

export const authService = new AuthService();
