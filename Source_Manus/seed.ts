/**
 * Script para popular o banco de dados com dados iniciais
 * Execute com: tsx database/seed.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function seed() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL não configurada!");
    process.exit(1);
  }

  console.log("🌱 Iniciando seed do banco de dados...");

  try {
    const client = postgres(DATABASE_URL);
    const db = drizzle(client, { schema });

    console.log("✅ Conectado ao PostgreSQL!");

    // 1. Criar Super Admin (se não existir)
    console.log("\n📝 Criando Super Admin...");
    const [existingAdmin] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, "admin"))
      .limit(1);

    if (!existingAdmin) {
      await db.insert(schema.users).values({
        id: generateId("user"),
        email: "admin",
        password: "adminadmin", // Em produção, use hash!
        name: "Super Administrator",
        role: "SUPER_ADMIN",
        organizationId: null,
        active: true,
      });
      console.log("   ✅ Super Admin criado (email: admin, senha: adminadmin)");
    } else {
      console.log("   ℹ️  Super Admin já existe");
    }

    // 2. Criar organização demo (se não existir)
    console.log("\n📝 Criando organização demo...");
    const [existingOrg] = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.name, "Demo Organization"))
      .limit(1);

    let demoOrgId: string;

    if (!existingOrg) {
      demoOrgId = generateId("org");
      await db.insert(schema.organizations).values({
        id: demoOrgId,
        name: "Demo Organization",
        active: true,
        settings: null,
      });
      console.log("   ✅ Organização demo criada");
    } else {
      demoOrgId = existingOrg.id;
      console.log("   ℹ️  Organização demo já existe");
    }

    // 3. Criar admin da organização demo (se não existir)
    console.log("\n📝 Criando admin da organização demo...");
    const [existingDemoAdmin] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, "demo@admin.com"))
      .limit(1);

    if (!existingDemoAdmin) {
      await db.insert(schema.users).values({
        id: generateId("user"),
        email: "demo@admin.com",
        password: "demo123",
        name: "Demo Admin",
        role: "ORG_ADMIN",
        organizationId: demoOrgId,
        active: true,
      });
      console.log("   ✅ Admin demo criado (email: demo@admin.com, senha: demo123)");
    } else {
      console.log("   ℹ️  Admin demo já existe");
    }

    console.log("\n✅ Seed concluído com sucesso!");
    console.log("\n📋 Credenciais:");
    console.log("   Super Admin: admin / adminadmin");
    console.log("   Demo Admin:  demo@admin.com / demo123");

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao fazer seed:", error);
    process.exit(1);
  }
}

seed();
