# Assistente Inteligente para Apoio ao Trabalho de Conclusão de Curso (TCC)

## 📌 Visão Geral

Este projeto implementa um **assistente inteligente baseado em Recuperação Aumentada por Geração (RAG – Retrieval-Augmented Generation)** com o objetivo de apoiar estudantes durante a elaboração do Trabalho de Conclusão de Curso (TCC).

O sistema utiliza documentos normativos e orientativos como base de conhecimento, permitindo que o usuário realize consultas em linguagem natural e receba respostas contextualizadas, fundamentadas nas normas e diretrizes do TCC.

A solução foi desenvolvida com foco acadêmico, priorizando **clareza arquitetural**, **rastreabilidade das fontes** e **facilidade de explicação metodológica**, atendendo aos requisitos de um projeto de pesquisa aplicada.

---

## 🎯 Objetivo do Projeto

Desenvolver um protótipo funcional de assistente conversacional capaz de:

- Interpretar perguntas relacionadas ao TCC;
- Recuperar trechos relevantes de documentos normativos;
- Gerar respostas claras, coerentes e alinhadas às normas acadêmicas;
- Apoiar estudantes no entendimento de regras, prazos, formatação e estrutura do TCC.

---

## 🧠 Abordagem Técnica (RAG)

A arquitetura do sistema segue o paradigma **Retrieval-Augmented Generation**, combinando:

1. **Base de Conhecimento**: documentos acadêmicos previamente preparados;
2. **Indexação Vetorial**: geração de embeddings e armazenamento em vector store;
3. **Recuperação Semântica**: busca por similaridade com base na consulta do usuário;
4. **Geração de Resposta**: uso de um modelo de linguagem para sintetizar a resposta a partir dos trechos recuperados.

Essa abordagem reduz alucinações, aumenta a confiabilidade das respostas e garante aderência ao conteúdo normativo.

---

## 🗂️ Estrutura do Projeto

```text
TCC/
├─ docs/                 # Base de conhecimento (documentos em Markdown)
│  ├─ manual_geral_tcc_rag.md
│  ├─ manual_formatacao_rag.md
│  └─ cronograma_entregas_rag.md
│
├─ scripts/              # Pipelines offline (pré-processamento)
│  ├─ ingest/
│  │  └─ index_documents.js
│  ├─ vectorstore/
│  │  └─ new_vectorstore.js
│  └─ validation/
│     └─ check.js
│
├─ src/                  # Camada de execução (runtime)
│  └─ server.js
│
├─ .env                  # Variáveis de ambiente
├─ package.json
├─ package-lock.json
└─ README.md
```

---

## 🔄 Pipeline de Funcionamento

### 1️⃣ Preparação dos Documentos

Os documentos localizados em `docs/` são previamente revisados, segmentados e adaptados para uso em um sistema RAG.

### 2️⃣ Ingestão e Indexação

O script `scripts/ingest/index_documents.js`:

- Lê os documentos da base de conhecimento;
- Divide o conteúdo em fragmentos semânticos;
- Gera embeddings vetoriais;
- Armazena os vetores no vector store.

### 3️⃣ Validação

O script `scripts/validation/check.js` permite verificar:

- Se os documentos foram corretamente indexados;
- Se o vector store está acessível;
- Se as consultas retornam resultados esperados.

### 4️⃣ Execução do Assistente

O arquivo `src/server.js` é responsável por:

- Receber perguntas do usuário;
- Consultar o vector store;
- Enviar os trechos recuperados ao modelo de linguagem;
- Retornar a resposta final ao usuário.

---

## ⚙️ Configuração do Ambiente

1. Instale as dependências:

```bash
npm install
```

2. Configure o arquivo `.env` com as variáveis necessárias (ex.: chave de API, identificador do vector store, etc.).

3. Execute o pipeline de ingestão:

```bash
node scripts/ingest/index_documents.js
```

4. Inicie o servidor:

```bash
node src/server.js
```

---

## 📚 Contexto Acadêmico

Este projeto possui caráter **aplicado e experimental**, sendo utilizado como parte do desenvolvimento de um Trabalho de Conclusão de Curso. A solução proposta busca demonstrar, de forma prática, a aplicação de modelos de linguagem e técnicas de recuperação semântica em um problema real do contexto educacional.

Todos os dados utilizados são de caráter normativo e instrucional, não envolvendo informações sensíveis ou pessoais.

---

## 🚀 Possíveis Evoluções

- Inclusão de múltiplas bases de conhecimento;
- Controle de versão dos documentos indexados;
- Avaliação quantitativa da qualidade das respostas;
- Interface web para interação com o assistente;
- Mecanismos de observabilidade e logging.

---

## 🧩 Considerações Finais

O projeto demonstra como sistemas baseados em RAG podem ser utilizados como ferramentas de apoio acadêmico, promovendo melhor compreensão das normas e maior autonomia por parte dos estudantes durante o processo de elaboração do TCC.

---

## 🤖 Link para testar o chatbot

[Clique aqui](https://vitor-leal-c2rmk.chat.blip.ai/?appKey=dGNjMTI6Y2ZhMjgzOTAtMTI1Yi00ZTYzLTg1YTAtNGRhMjk1NGVlMzUx)
