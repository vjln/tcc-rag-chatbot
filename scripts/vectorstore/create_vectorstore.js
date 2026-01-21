import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.BANANAMADURA });

async function main() {
  const store = await openai.vectorStores.create({
    name: "tcc-manual-v1", // nome livre
  });

  console.log("✅ VECTOR_STORE_ID NOVO:");
  console.log(store.id);
}

main();
