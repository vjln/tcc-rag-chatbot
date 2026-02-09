function doPost(e) {
  const ss = SpreadsheetApp.openById("{{YOUR_TOKEN_HERE}}");
  const logs = ss.getSheetByName("Logs") || ss.getSheets()[0];
  const data = JSON.parse(e.postData.contents);

  const sessionId = data.sessionId || "";
  const timestamp = data.timestamp || new Date().toISOString();
  const pergunta = (data.pergunta || "").toString();
  const resposta = (data.resposta || "").toString();
  const fontes = (data.fontes || "").toString();

  // Extrai ID da pergunta no formato Q01, Q02, ...
  const idPergunta = extrairIdPergunta(pergunta);

  // Avalia com base no gabarito
  let result;
  try {
    result = avaliarPorId(idPergunta, resposta, fontes, ss);

    // Fallback: garante campos mesmo se vier undefined ou incompleto
    if (!result || typeof result !== "object") {
      result = {
        avaliacao: "ERRO_AVALIADOR",
        scoreText: "",
        motivo: "avaliarPorId retornou vazio",
      };
    } else {
      result.avaliacao = result.avaliacao || "ERRO_AVALIADOR";
      result.scoreText = result.scoreText || "";
      result.motivo = result.motivo || "avaliarPorId sem motivo";
    }
  } catch (err) {
    result = {
      avaliacao: "ERRO_SCRIPT",
      scoreText: "",
      motivo: err && err.message ? err.message : String(err),
    };
  }

  logs.appendRow([
    sessionId, // A
    timestamp, // B
    pergunta, // C
    resposta, // D
    fontes, // E
    result.avaliacao, // F
    "", // G observacoes
    result.scoreText, // H
    result.motivo, // I
    idPergunta, // J
  ]);

  return ContentService.createTextOutput("OK");
}

/**
 * Espera perguntas começando com:
 * "Q01 - ..." ou "Q01: ..." ou "Q01 ..." (com espaço)
 */
function extrairIdPergunta(pergunta) {
  const m = (pergunta || "").trim().match(/^(Q\d{2})\b/i);
  return m ? m[1].toUpperCase() : "";
}

/**
 * Avalia por linha na aba "Gabarito" usando id_pergunta.
 * Colunas do gabarito:
 * A id_pergunta
 * B pergunta_exata
 * C keywords_obrig
 * D keywords_proibi
 * E fontes_obrigator
 * F nota_max
 */
function avaliarPorId(idPergunta, resposta, fontes, ss) {
  const gab = ss.getSheetByName("Gabarito");
  if (!gab) {
    return {
      avaliacao: "SEM_GABARITO",
      scoreText: "",
      motivo: "Aba 'Gabarito' não encontrada.",
    };
  }

  if (!idPergunta) {
    return {
      avaliacao: "SEM_ID",
      scoreText: "",
      motivo: "Pergunta não contém ID (ex: Q01).",
    };
  }

  const values = gab.getDataRange().getValues();
  if (values.length <= 1) {
    return {
      avaliacao: "SEM_REGRAS",
      scoreText: "",
      motivo: "Gabarito vazio.",
    };
  }

  // acha a linha do ID
  let row = null;
  for (let i = 1; i < values.length; i++) {
    const rowId = (values[i][0] || "").toString().trim().toUpperCase();
    if (rowId === idPergunta) {
      row = values[i];
      break;
    }
  }

  if (!row) {
    return {
      avaliacao: "SEM_MATCH",
      scoreText: "",
      motivo: `ID ${idPergunta} não encontrado no gabarito.`,
    };
  }

  const keywordsObrig = splitList(row[2]);
  const keywordsProib = splitList(row[3]);
  const fontesObrig = splitList(row[4]);
  const notaMax = Number(row[5] || 10);

  const r = normalizar(resposta);
  const f = normalizar(fontes);

  let pontos = notaMax;
  const motivos = [];

  // Penalidade por keyword obrigatória faltando
  if (keywordsObrig.length) {
    const perda = Math.max(1, Math.ceil(notaMax / (keywordsObrig.length + 1)));
    keywordsObrig.forEach((k) => {
      const kk = normalizar(k);
      if (kk && !r.includes(kk)) {
        pontos -= perda;
        motivos.push(`Faltou: "${k}" (-${perda})`);
      }
    });
  }

  // Penalidade forte por keyword proibida
  keywordsProib.forEach((k) => {
    const kk = normalizar(k);
    if (kk && r.includes(kk)) {
      pontos = Math.min(pontos, Math.floor(notaMax * 0.2));
      motivos.push(`Proibida: "${k}" (penalidade forte)`);
    }
  });

  // Checagem de fonte (se você está logando fontes)
  if (fontesObrig.length) {
    const perdaFonte = Math.max(
      1,
      Math.ceil(notaMax / (fontesObrig.length + 2)),
    );
    fontesObrig.forEach((s) => {
      const ss = normalizar(s);
      if (ss && !f.includes(ss)) {
        pontos -= perdaFonte;
        motivos.push(`Fonte ausente: "${s}" (-${perdaFonte})`);
      }
    });
  }

  pontos = Math.max(0, Math.min(notaMax, pontos));

  // Classificação (10/5/0 “conceitual”)
  let avaliacao = "INCORRETA";
  if (pontos >= notaMax * 0.8) avaliacao = "CORRETA";
  else if (pontos >= notaMax * 0.5) avaliacao = "PARCIAL";

  return {
    avaliacao,
    scoreText: `${pontos}/${notaMax}`,
    motivo: motivos.length ? motivos.join(" | ") : "OK",
  };
}

function splitList(v) {
  if (!v) return [];
  return v
    .toString()
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizar(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
