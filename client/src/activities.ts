import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb, generateId } from "../db";
import { activities } from "../../drizzle/schema";

export const activitiesRouter = router({
  // Listar activities (filtrado por organização)
  list: publicProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db
        .select()
        .from(activities)
        .where(eq(activities.organizationId, input.organizationId));
    }),

  // Listar activities de um account específico
  listByAccount: publicProcedure
    .input(z.object({ accountId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db
        .select()
        .from(activities)
        .where(eq(activities.accountId, input.accountId));
    }),

  // Obter activity por ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [activity] = await db
        .select()
        .from(activities)
        .where(eq(activities.id, input.id))
        .limit(1);

      return activity || null;
    }),

  // Criar nova activity
  create: publicProcedure
    .input(
      z.object({
        organizationId: z.string(),
        accountId: z.string(),
        type: z.enum(["call", "email", "meeting", "note", "task"]),
        title: z.string().min(1),
        description: z.string().optional(),
        date: z.date(),
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
        createdBy: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const newActivity = {
        id: generateId("activity"),
        ...input,
        status: input.status || "pending",
      };

      await db.insert(activities).values(newActivity);

      return newActivity;
    }),

  // Atualizar activity
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        type: z.enum(["call", "email", "meeting", "note", "task"]).optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        date: z.date().optional(),
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updates } = input;

      await db.update(activities).set(updates).where(eq(activities.id, id));

      return { success: true };
    }),

  // Deletar activity
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(activities).where(eq(activities.id, input.id));

      return { success: true };
    }),
});
