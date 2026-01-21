import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.BANANAMADURA });

const VECTOR_STORE_ID = process.env.VECTOR_STORE_ID;

async function main() {
  console.log("Vector Store:", VECTOR_STORE_ID);

  // 1) Confirma que o store existe
  const vs = await openai.vectorStores.retrieve(VECTOR_STORE_ID);
  console.log("Nome:", vs.name);

  // 2) Lista arquivos anexados
  const files = await openai.vectorStores.files.list(VECTOR_STORE_ID);
  console.log("Arquivos anexados:", files.data.length);

  for (const f of files.data) {
    console.log("-", f.id, "status:", f.status);
  }
}

main().catch(console.error);
