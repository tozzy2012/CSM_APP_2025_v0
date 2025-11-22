import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb, generateId } from "../db";
import { playbooks } from "../../drizzle/schema";

export const playbooksRouter = router({
  // Listar playbooks (filtrado por organização)
  list: publicProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db
        .select()
        .from(playbooks)
        .where(eq(playbooks.organizationId, input.organizationId));
    }),

  // Obter playbook por ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [playbook] = await db
        .select()
        .from(playbooks)
        .where(eq(playbooks.id, input.id))
        .limit(1);

      return playbook || null;
    }),

  // Criar novo playbook
  create: publicProcedure
    .input(
      z.object({
        organizationId: z.string(),
        title: z.string().min(1),
        content: z.string().optional(),
        category: z.string().optional(),
        tags: z.any().optional(),
        createdBy: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const newPlaybook = {
        id: generateId("playbook"),
        ...input,
        updatedAt: new Date(),
      };

      await db.insert(playbooks).values(newPlaybook);

      return newPlaybook;
    }),

  // Atualizar playbook
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        content: z.string().optional(),
        category: z.string().optional(),
        tags: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updates } = input;

      await db
        .update(playbooks)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(playbooks.id, id));

      return { success: true };
    }),

  // Deletar playbook
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(playbooks).where(eq(playbooks.id, input.id));

      return { success: true };
    }),
});
