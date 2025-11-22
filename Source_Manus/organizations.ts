import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb, generateId } from "../db";
import { organizations } from "../../drizzle/schema";

export const organizationsRouter = router({
  // Listar todas as organizações
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db.select().from(organizations);
  }),

  // Obter organização por ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, input.id))
        .limit(1);

      return org || null;
    }),

  // Criar nova organização
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        settings: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const newOrg = {
        id: generateId("org"),
        name: input.name,
        settings: input.settings || null,
        active: true,
      };

      await db.insert(organizations).values(newOrg);

      return newOrg;
    }),

  // Atualizar organização
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        settings: z.any().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updates } = input;

      await db
        .update(organizations)
        .set(updates)
        .where(eq(organizations.id, id));

      return { success: true };
    }),

  // Deletar organização
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(organizations).where(eq(organizations.id, input.id));

      return { success: true };
    }),
});
