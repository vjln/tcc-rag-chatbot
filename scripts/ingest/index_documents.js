import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.API_KEY });

//trim pra evitar espaço oculto no .env
const VECTOR_STORE_ID = (process.env.VECTOR_STORE_ID || "").trim();

// aqui o nome do doc dentro de docs
const FILE_PATH = "../docs/cronograma_entregas_rag.md";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!VECTOR_STORE_ID) {
    throw new Error(
      "VECTOR_STORE_ID está vazio/undefined. Confira o .env e reinicie o terminal.",
    );
  }
  if (!fs.existsSync(FILE_PATH)) {
    throw new Error(`Arquivo não encontrado: ${FILE_PATH}`);
  }

  const stat = fs.statSync(FILE_PATH);
  if (stat.size === 0) throw new Error("Arquivo está vazio (0 bytes).");

  console.log("VECTOR_STORE_ID:", VECTOR_STORE_ID);
  console.log("FILE_PATH:", FILE_PATH);
  console.log("Tamanho (bytes):", stat.size);

  // 1) Upload para Files API
  console.log("\n1) Upload do arquivo (Files API)...");
  const up = await openai.files.create({
    file: fs.createReadStream(FILE_PATH),
    purpose: "assistants",
  });
  console.log("✅ Uploaded file_id:", up.id);

  // 2) Anexar ao Vector Store
  console.log("\n2) Anexando arquivo ao Vector Store...");
  await openai.vectorStores.files.create(VECTOR_STORE_ID, { file_id: up.id });
  console.log("✅ Arquivo anexado. file_id:", up.id);

  // 3) Poll via LIST (robusto)
  console.log("\n3) Aguardando indexação (poll via list)...");
  while (true) {
    // lista arquivos anexados ao store
    const files = await openai.vectorStores.files.list(VECTOR_STORE_ID);

    // procura o arquivo que você acabou de anexar
    const found = files.data.find((f) => f.id === up.id);

    if (!found) {
      console.log("Ainda não apareceu na lista... aguardando");
      await sleep(2000);
      continue;
    }

    console.log("Status:", found.status);

    if (found.status === "completed") {
      console.log("✅ Indexação concluída!");
      break;
    }
    if (found.status === "failed") {
      throw new Error("❌ Indexação falhou (status=failed).");
    }

    await sleep(2000);
  }

  console.log(
    "\n✅ Pronto. Pode consultar no prompt.js usando o VECTOR_STORE_ID do .env.",
  );
}

main().catch((e) => {
  console.error("\nERRO:", e?.error?.message || e.message || e);
  process.exitCode = 1;
});
