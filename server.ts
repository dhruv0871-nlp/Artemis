/**
 * Author: Dhruv
 * Artemis-RAG Server: Express backend for document ingestion proxy.
 */

import express from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const upload = multer({ storage: multer.memoryStorage() });

  app.use(express.json());

  // API Route: PDF Parsing (Backend only handles raw text extraction)
  app.post("/api/parse-pdf", upload.single("file"), async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const parser = new PDFParse({ data: req.file.buffer });
      const data = await parser.getText();
      res.json({ 
        text: data.text,
        metadata: {
          filename: req.file.originalname,
          size: req.file.size
        }
      });
    } catch (error: any) {
      console.error("PDF Parsing Error:", error);
      res.status(500).json({ error: "Failed to parse PDF" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "Forge Online", author: "Dhruv" });
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Artemis-RAG] Forge operational at http://localhost:${PORT}`);
    console.log(`[Author] Dhruv`);
  });
}

startServer();
