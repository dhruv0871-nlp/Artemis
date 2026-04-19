/**
 * Author: Dhruv
 * Artemis-RAG Retriever: Vector database search and context retrieval logic.
 */

import { GoogleGenAI } from "@google/genai";
import { CONFIG, logger } from "./config";
import { DocumentChunk } from "./ingest";

export class Retriever {
  private ai: GoogleGenAI;
  private vectorStore: { embedding: number[]; content: string; metadata: any }[] = [];

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Generates embeddings for a list of chunks and adds them to the vector store.
   */
  async addDocuments(chunks: DocumentChunk[]) {
    logger.info(`Generating embeddings for ${chunks.length} chunks...`);
    
    for (const chunk of chunks) {
      const response = await this.ai.models.embedContent({
        model: CONFIG.EMBEDDING_MODEL,
        contents: [{ parts: [{ text: chunk.pageContent }] }]
      });
      
      const embedding = response.embeddings[0].values;
      this.vectorStore.push({
        embedding,
        content: chunk.pageContent,
        metadata: chunk.metadata
      });
    }
    
    logger.info("Vector store updated successfully.");
  }

  /**
   * Performs a simple cosine similarity search to retrieve relevant context.
   */
  async query(queryText: string, k: number = 3) {
    logger.info(`Retrieving top ${k} results for: "${queryText}"`);
    
    const queryEmbeddingResponse = await this.ai.models.embedContent({
      model: CONFIG.EMBEDDING_MODEL,
      contents: [{ parts: [{ text: queryText }] }]
    });
    
    const queryEmbedding = queryEmbeddingResponse.embeddings[0].values;
    
    const scores = this.vectorStore.map(doc => ({
      ...doc,
      score: this.cosineSimilarity(queryEmbedding, doc.embedding)
    }));
    
    scores.sort((a, b) => b.score - a.score);
    
    return scores.slice(0, k);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
