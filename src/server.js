import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";

const app = express();

// Segurança básica
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Rate limit (ajuste conforme necessidade)
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 min
    max: 60, // 60 req/min por IP
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

const openai = new OpenAI({ apiKey: process.env.API_KEY });

const VECTOR_STORE_ID = (process.env.VECTOR_STORE_ID || "").trim();
const API_SECRET = (process.env.API_SECRET || "").trim();

function requireEnv(name, value) {
  if (!value) {
    console.error(`${name} vazio no .env`);
    process.exit(1);
  }
}

requireEnv("API_KEY", process.env.API_KEY);
requireEnv("VECTOR_STORE_ID", VECTOR_STORE_ID);
requireEnv("API_SECRET", API_SECRET);

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/ask", async (req, res) => {
  const secret = (req.headers["x-api-secret"] || "").toString().trim();
  if (secret !== API_SECRET)
    return res.status(401).json({ error: "unauthorized" });

  try {
    const question = (req.body?.question || "").toString().trim();
    if (!question)
      return res.status(400).json({ error: "question é obrigatório" });

    const resp = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: `Você é um assistente acadêmico especializado em Trabalho de Conclusão de Curso (TCC).

Responda sempre com base exclusivamente nos documentos fornecidos.
Explique os conceitos de forma clara, objetiva e didática.

Regras obrigatórias:
- Quando a pergunta envolver um conceito teórico ou metodológico, explique:
  (1) o que é o conceito
  (2) qual é a sua função no TCC.
- Quando a pergunta envolver comparação (ex.: tipos de citação), descreva claramente
  as diferenças entre os elementos, preferencialmente em itens separados.
- Quando a pergunta envolver etapas, fases ou processos, apresente a resposta de forma estruturada,
  indicando a sequência lógica.
- Não invente informações que não estejam presentes nos documentos.
- Caso a informação não esteja disponível na base, informe explicitamente que não foi encontrada.

Use linguagem acadêmica clara, sem excesso de formalismo.
Evite respostas excessivamente curtas ou genéricas.
Sempre que possível, forneça citações dos documentos utilizados na resposta, incluindo o nome do arquivo.`,
        },
        { role: "user", content: question },
      ],
      tools: [
        {
          type: "file_search",
          vector_store_ids: [VECTOR_STORE_ID],
        },
      ],
      temperature: 0.0,
    });

    const answer =
      resp.output_text?.trim() ||
      "Não encontrei essa informação no material fornecido.";

    const citations = [];

    for (const item of resp.output ?? []) {
      if (item.type !== "message" || !Array.isArray(item.content)) continue;

      for (const part of item.content) {
        if (part.type !== "output_text" || !Array.isArray(part.annotations))
          continue;

        for (const ann of part.annotations) {
          if (ann.type === "file_citation") {
            const fileId = ann.file_citation?.file_id || ann.file_id; // fallback defensivo
            if (!fileId) continue;

            citations.push({
              file_id: fileId,
              file_name: ann.filename || null,
            });
          }
        }
      }
    }

    // só o doc, sem quotes
    const byFile = new Map();
    for (const c of citations) {
      if (!byFile.has(c.file_id)) byFile.set(c.file_id, c);
    }

    // Resolve filename (best-effort) caso não venha no annotation
    const fileNameCache = new Map();
    for (const c of byFile.values()) {
      if (c.file_name) continue;

      if (!fileNameCache.has(c.file_id)) {
        try {
          const fileInfo = await openai.files.retrieve(c.file_id);
          fileNameCache.set(c.file_id, fileInfo?.filename || c.file_id);
        } catch {
          fileNameCache.set(c.file_id, c.file_id);
        }
      }
      c.file_name = fileNameCache.get(c.file_id);
    }

    // Retorna só nomes (e ids internamente, se precisar)
    const sources = Array.from(byFile.values()).map((s) => ({
      file_id: s.file_id,
      file_name: s.file_name,
    }));

    if (sources.length === 0) {
      return res.json({
        answer: "Não encontrei essa informação no material fornecido.",
        sources: [],
      });
    }

    res.json({ answer, sources });
  } catch (err) {
    const msg = err?.error?.message || err?.message || "Erro desconhecido";
    res.status(500).json({ error: msg });
  }
});

export default app;
