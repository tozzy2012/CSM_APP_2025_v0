import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb, generateId } from "../db";
import { users } from "../../drizzle/schema";

export const usersRouter = router({
  // Listar usuários (com filtro opcional por organização)
  list: publicProcedure
    .input(
      z
        .object({
          organizationId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(users);

      if (input?.organizationId) {
        query = query.where(eq(users.organizationId, input.organizationId)) as any;
      }

      const allUsers = await query;

      // Remover senhas antes de retornar
      return allUsers.map(({ password, ...user }) => user);
    }),

  // Obter usuário por ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);

      if (!user) return null;

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }),

  // Criar novo usuário
  create: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
        name: z.string().min(1),
        role: z.enum(["SUPER_ADMIN", "ORG_ADMIN", "CSM"]),
        organizationId: z.string().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se email já existe
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existing) {
        throw new Error("Email already exists");
      }

      const newUser = {
        id: generateId("user"),
        ...input,
        active: true,
      };

      await db.insert(users).values(newUser);

      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    }),

  // Atualizar usuário
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().email().optional(),
        password: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        role: z.enum(["SUPER_ADMIN", "ORG_ADMIN", "CSM"]).optional(),
        organizationId: z.string().nullable().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updates } = input;

      await db.update(users).set(updates).where(eq(users.id, id));

      return { success: true };
    }),

  // Deletar usuário
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(users).where(eq(users.id, input.id));

      return { success: true };
    }),
});
