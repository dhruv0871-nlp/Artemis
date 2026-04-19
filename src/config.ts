/**
 * Author: Dhruv
 * Artemis-RAG Config: Environment and Logging Setup
 */

export const CONFIG = {
  MODEL_NAME: "gemini-3-flash-preview",
  EMBEDDING_MODEL: "gemini-embedding-2-preview",
  CHUNK_SIZE: 1000,
  CHUNK_OVERLAP: 200,
  PROJECT_NAME: "Artemis-RAG Forge",
  AUTHOR: "Dhruv",
  LOG_LEVEL: "INFO",
};

export const logger = {
  info: (msg: string) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`),
  error: (msg: string) => console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`),
  warn: (msg: string) => console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`),
};
