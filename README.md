# Artemis-RAG Forge

**Developed by Dhruv**

Artemis-RAG Forge is a production-grade Retrieval-Augmented Generation (RAG) system engineered for high-throughput document intelligence. It provides a complete end-to-end pipeline for ingesting PDF documents, generating semantically aware fragments, calculating high-dimensional vector embeddings, and performing precision retrieval for LLM-based synthetic answering.

## 🏗️ Architecture Overview

The system is architected with a decoupled full-stack approach:

1.  **Ingestion Engine (Backend/Node):** Handles raw binary PDF processing using `pdf-parse`, extracting clean text streams for the pipeline.
2.  **Semantic Chunking (Frontend):** Utilizes recursive character splitting with a 1000-token window and 200-token overlap to maintain structural context across fragments.
3.  **Vector Store (Frontend/Memory):** A high-performance in-memory vector database utilizing Cosine Similarity for semantic retrieval.
4.  **Intelligence Layer (Gemini-3 Flash):** Leverages the state-of-the-art Gemini 3 Flash model for both high-dimension embeddings (`text-embedding-004`) and context-grounded response generation.

## 🛠️ Tech Stack

*   **Backend:** Node.js, Express
*   **Frontend:** React 19, Vite, Tailwind CSS (V4)
*   **AI Engine:** Google Gemini API (Gemini 3 Flash)
*   **Parsing:** pdf-parse
*   **Orchestration:** LangChain.js
*   **Motion:** Motion (formerly Framer Motion)

## 🚀 Setup & Deployment

### Prerequisites

*   Node.js 20+
*   Google Gemini API Key

### Environment Configuration

Define your secrets in your environment or via the system interface:

```env
GEMINI_API_KEY=your_production_api_key
```

### Installation

```bash
npm install
```

### Development Execution

Starts the Artemis-RAG Forge in full-stack dev mode:

```bash
npm run dev
```

## 🔌 API Documentation

### POST `/api/parse-pdf`

Extracts raw text from a PDF file.

*   **Payload:** `multipart/form-data` with `file` field.
*   **Success Response:** `200 OK` with JSON:
    ```json
    {
      "text": "...",
      "metadata": { "filename": "doc.pdf", "size": 1024 }
    }
    ```

## 🧠 High-Precision RAG Logic

The system operates on the **"Master Retrieval Gate"** pattern:

1.  **Ingest:** Recursive splitting ensures sub-chunk coherence.
2.  **Embed:** Chunks are mapped to 768-dimension vectors.
3.  **Retrieve:** Top-K search identifies the most relevant data fragments.
4.  **Augment:** Gemini is prompted with strict grounding rules to avoid hallucinations.

---

*Mission-critical AI tooling by Dhruv.*
