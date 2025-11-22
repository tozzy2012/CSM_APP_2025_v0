import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb, generateId } from "../db";
import { accounts } from "../../drizzle/schema";

export const accountsRouter = router({
  // Listar accounts (filtrado por organização)
  list: publicProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db
        .select()
        .from(accounts)
        .where(eq(accounts.organizationId, input.organizationId));
    }),

  // Obter account por ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [account] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, input.id))
        .limit(1);

      return account || null;
    }),

  // Criar novo account
  create: publicProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().min(1),
        clientId: z.string().nullable().optional(),
        mrr: z.number().optional(),
        healthScore: z.number().optional(),
        status: z.string().optional(),
        csm: z.string().optional(),
        onboardingDate: z.date().nullable().optional(),
        renewalDate: z.date().nullable().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const newAccount = {
        id: generateId("account"),
        ...input,
        mrr: input.mrr?.toString() || "0",
        healthScore: input.healthScore || 0,
        status: input.status || "healthy",
      };

      await db.insert(accounts).values(newAccount);

      return newAccount;
    }),

  // Atualizar account
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        clientId: z.string().nullable().optional(),
        mrr: z.number().optional(),
        healthScore: z.number().optional(),
        status: z.string().optional(),
        csm: z.string().optional(),
        onboardingDate: z.date().nullable().optional(),
        renewalDate: z.date().nullable().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, mrr, ...otherUpdates } = input;

      const updates: any = { ...otherUpdates };
      if (mrr !== undefined) {
        updates.mrr = mrr.toString();
      }

      await db.update(accounts).set(updates).where(eq(accounts.id, id));

      return { success: true };
    }),

  // Deletar account
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(accounts).where(eq(accounts.id, input.id));

      return { success: true };
    }),

  // Obter estatísticas (para Dashboard)
  getStats: publicProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allAccounts = await db
        .select()
        .from(accounts)
        .where(eq(accounts.organizationId, input.organizationId));

      const totalAccounts = allAccounts.length;
      const totalMRR = allAccounts.reduce(
        (sum, acc) => sum + parseFloat(acc.mrr || "0"),
        0
      );
      const avgHealthScore =
        totalAccounts > 0
          ? allAccounts.reduce((sum, acc) => sum + (acc.healthScore || 0), 0) /
            totalAccounts
          : 0;

      const atRisk = allAccounts.filter(
        (acc) => (acc.healthScore || 0) < 50
      ).length;

      return {
        totalAccounts,
        totalMRR,
        avgHealthScore: Math.round(avgHealthScore),
        atRisk,
      };
    }),
});
