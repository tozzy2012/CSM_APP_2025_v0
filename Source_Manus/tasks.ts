import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb, generateId } from "../db";
import { tasks } from "../../drizzle/schema";

export const tasksRouter = router({
  // Listar tasks (filtrado por organização)
  list: publicProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db
        .select()
        .from(tasks)
        .where(eq(tasks.organizationId, input.organizationId));
    }),

  // Listar tasks de um account específico
  listByAccount: publicProcedure
    .input(z.object({ accountId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db
        .select()
        .from(tasks)
        .where(eq(tasks.accountId, input.accountId));
    }),

  // Obter task por ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [task] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, input.id))
        .limit(1);

      return task || null;
    }),

  // Criar nova task
  create: publicProcedure
    .input(
      z.object({
        organizationId: z.string(),
        accountId: z.string().nullable().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueDate: z.date().nullable().optional(),
        assignedTo: z.string().optional(),
        createdBy: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const newTask = {
        id: generateId("task"),
        ...input,
        status: input.status || "pending",
        priority: input.priority || "medium",
        completedAt: null,
      };

      await db.insert(tasks).values(newTask);

      return newTask;
    }),

  // Atualizar task
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueDate: z.date().nullable().optional(),
        assignedTo: z.string().optional(),
        completedAt: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updates } = input;

      // Se status mudou para "completed", definir completedAt
      if (updates.status === "completed" && !updates.completedAt) {
        updates.completedAt = new Date();
      }

      await db.update(tasks).set(updates).where(eq(tasks.id, id));

      return { success: true };
    }),

  // Deletar task
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(tasks).where(eq(tasks.id, input.id));

      return { success: true };
    }),
});
