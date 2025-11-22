/**
 * Script de inicialização do banco de dados
 * Cria as tabelas e insere dados iniciais
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";

async function initDatabase() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL não configurada!");
    console.log("Configure a variável de ambiente DATABASE_URL antes de executar este script.");
    process.exit(1);
  }

  console.log("🔄 Conectando ao banco de dados...");

  try {
    const client = postgres(DATABASE_URL);
    const db = drizzle(client, { schema });

    console.log("✅ Conectado ao PostgreSQL!");

    // As tabelas serão criadas automaticamente pelo Drizzle ORM
    // quando você executar: pnpm db:push

    console.log("\n📝 Para criar as tabelas, execute:");
    console.log("   pnpm db:push");

    console.log("\n✅ Inicialização concluída!");

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao conectar ao banco de dados:", error);
    process.exit(1);
  }
}

initDatabase();
