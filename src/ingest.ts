/**
 * Author: Dhruv
 * Artemis-RAG Ingest: Document parsing and chunking logic.
 */

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CONFIG, logger } from "./config";

export interface DocumentChunk {
  pageContent: string;
  metadata: Record<string, any>;
}

export class Ingestor {
  private splitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: CONFIG.CHUNK_SIZE,
      chunkOverlap: CONFIG.CHUNK_OVERLAP,
    });
  }

  /**
   * Chunks a raw string of text into manageable pieces for embedding.
   */
  async chunkText(text: string, metadata: Record<string, any> = {}): Promise<DocumentChunk[]> {
    logger.info(`Starting ingestion for document: ${metadata.filename || "unknown"}`);
    
    const chunks = await this.splitter.createDocuments([text], [metadata]);
    
    logger.info(`Generated ${chunks.length} chunks.`);
    return chunks;
  }
}
