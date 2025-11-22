import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb, generateId } from "../db";
import { clients } from "../../drizzle/schema";

export const clientsRouter = router({
  // Listar clientes (filtrado por organização)
  list: publicProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db
        .select()
        .from(clients)
        .where(eq(clients.organizationId, input.organizationId));
    }),

  // Obter cliente por ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, input.id))
        .limit(1);

      return client || null;
    }),

  // Criar novo cliente
  create: publicProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().min(1),
        industry: z.string().optional(),
        size: z.string().optional(),
        website: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const newClient = {
        id: generateId("client"),
        ...input,
      };

      await db.insert(clients).values(newClient);

      return newClient;
    }),

  // Atualizar cliente
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        industry: z.string().optional(),
        size: z.string().optional(),
        website: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updates } = input;

      await db.update(clients).set(updates).where(eq(clients.id, id));

      return { success: true };
    }),

  // Deletar cliente
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(clients).where(eq(clients.id, input.id));

      return { success: true };
    }),
});
