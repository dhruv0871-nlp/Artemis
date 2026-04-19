/**
 * Author: Dhruv
 * Artemis-RAG Forge: Production-ready Retrieval-Augmented Generation System.
 */

import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Search, 
  Upload, 
  Cpu, 
  Terminal, 
  Layers, 
  Activity,
  ArrowRight,
  Database,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Ingestor } from './ingest';
import { Retriever } from './retriever';
import { CONFIG, logger } from './config';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Ensure Gemini API key is present
const API_KEY = process.env.GEMINI_API_KEY;

export default function App() {
  const [isIngesting, setIsIngesting] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [files, setFiles] = useState<{ name: string; chunks: number; id: string }[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ content: string; score: number; metadata: any }[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const ingestor = useRef(new Ingestor());
  const retriever = useRef<Retriever | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (API_KEY) {
      retriever.current = new Retriever(API_KEY);
      addLog("Artemis-RAG Forge initialized. Ready for ingestion.");
    } else {
      setError("GEMINI_API_KEY missing in environment secrets.");
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, answer]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-50));
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !retriever.current) return;

    setIsIngesting(true);
    setError(null);
    addLog(`Ingesting: ${file.name}`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      addLog("Extracting raw text via Forge-Backend...");
      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Backend parse failed.");

      const { text, metadata } = await response.json();
      addLog(`Text extraction complete (${text.length} chars).`);

      addLog("Starting recursive chunking...");
      const chunks = await ingestor.current.chunkText(text, metadata);
      addLog(`Generated ${chunks.length} semantically aware chunks.`);

      addLog("Generating vector embeddings...");
      await retriever.current.addDocuments(chunks);

      setFiles(prev => [...prev, { name: file.name, chunks: chunks.length, id: Math.random().toString(36).substr(2, 9) }]);
      addLog("Ingestion lifecycle complete.");
    } catch (err: any) {
      setError(`Forge Error: ${err.message}`);
      addLog(`FATAL: Ingestion failed - ${err.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleQuery = async (e: FormEvent) => {
    e.preventDefault();
    if (!query || !retriever.current || isQuerying) return;

    setIsQuerying(true);
    setAnswer(null);
    setError(null);
    addLog(`Query Initiated: ${query}`);

    try {
      addLog("Calculating query vector and scanning index...");
      const context = await retriever.current.query(query);
      setResults(context);
      addLog(`Context retrieved: ${context.length} relevant fragments.`);

      const ai = new GoogleGenAI({ apiKey: API_KEY! });
      const contextText = context.map(c => `[Source: ${c.metadata.filename}]: ${c.content}`).join("\n\n");

      addLog("Generating synthetic answer via Gemini Force...");
      const genResponse = await ai.models.generateContent({
        model: CONFIG.MODEL_NAME,
        contents: [
          {
            role: "user",
            parts: [{
              text: `You are Artemis-Gen, a precise RAG assistant. Answer the user prompt based ONLY on the provided context. 
              If the answer is not in the context, state that clearly.
              
              CONTEXT:
              ${contextText}
              
              PROMPT:
              ${query}`
            }]
          }
        ],
        config: {
          temperature: 0.1, // High precision for RAG
        }
      });

      setAnswer(genResponse.text || "No response generated.");
      addLog("Generation complete.");
    } catch (err: any) {
      setError(`Query Link Failure: ${err.message}`);
      addLog(`ERROR: Retrieval/Generation pipeline failed.`);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="min-h-screen technical-grid text-ink p-4 md:p-10 flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-ink pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-5 h-5" />
            <span className="font-mono text-xs uppercase tracking-widest opacity-60">Production Unit</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif italic font-bold tracking-tight">
            Artemis-RAG Forge
          </h1>
          <p className="font-mono text-sm mt-1 opacity-80">
            End-to-end vector intelligence stack // Engineer: Dhruv
          </p>
        </div>
        <div className="flex gap-4">
          <div className="p-4 border border-line bg-white/50 backdrop-blur min-w-[160px]">
            <span className="block font-serif italic text-xs opacity-50 uppercase mb-2">Systems Status</span>
            <div className="flex items-center gap-2 font-mono text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              ONLINE
            </div>
          </div>
          <div className="p-4 border border-line bg-white/50 backdrop-blur min-w-[160px]">
            <span className="block font-serif italic text-xs opacity-50 uppercase mb-2">Local Index</span>
            <div className="flex items-center gap-2 font-mono text-sm font-bold">
              <Database className="w-4 h-4" />
              {files.reduce((acc, f) => acc + f.chunks, 0)} CHUNKS
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Left Column: Input & Logs */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Upload Section */}
          <section className="bg-white border-2 border-ink p-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="font-serif italic text-xl mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Document Ingestion
            </h2>
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
              disabled={isIngesting}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isIngesting}
              className={cn(
                "w-full py-6 border-2 border-dashed border-ink/30 flex flex-col items-center justify-center gap-2 transition-all hover:bg-ink/5 group",
                isIngesting && "opacity-50 cursor-not-allowed"
              )}
            >
              {isIngesting ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
              )}
              <span className="font-mono text-sm uppercase">
                {isIngesting ? "Parsing Logic..." : "Deploy PDF to Forge"}
              </span>
            </button>

            {/* Ingested Files List */}
            <div className="mt-6 space-y-2">
              {files.map(f => (
                <div key={f.id} className="data-row flex items-center justify-between py-2 px-3 font-mono text-xs">
                  <div className="flex items-center gap-2 truncate pr-4">
                    <FileText className="w-3 h-3 min-w-[12px]" />
                    <span className="truncate">{f.name}</span>
                  </div>
                  <span className="text-muted shrink-0">{f.chunks}C</span>
                </div>
              ))}
              {files.length === 0 && !isIngesting && (
                <p className="text-center font-mono text-[10px] uppercase opacity-40 py-4">No documents hashed</p>
              )}
            </div>
          </section>

          {/* System Logs */}
          <section className="bg-ink text-bg p-6 flex-1 flex flex-col shadow-[8px_8px_0px_0px_rgba(20,20,20,0.5)]">
            <h2 className="font-serif italic text-xl mb-4 flex items-center gap-2 text-white">
              <Terminal className="w-5 h-5 text-green-500" />
              Pulse Logs
            </h2>
            <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 custom-scrollbar pr-2">
              {logs.map((log, i) => (
                <div key={i} className="opacity-80">
                  <span className="text-green-500 mr-2 opacity-50">{">"}</span>
                  {log}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </section>
        </div>

        {/* Right Column: Query & Results */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Query Bar */}
          <form onSubmit={handleQuery} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="PROBE THE DATA VECTOR..."
                className="w-full bg-white border-2 border-ink py-4 pl-12 pr-4 font-mono text-sm uppercase focus:outline-none focus:ring-4 focus:ring-ink/10 transition-shadow"
              />
            </div>
            <button 
              type="submit"
              disabled={isQuerying || !query || files.length === 0}
              className="bg-ink text-bg px-8 font-serif italic text-xl flex items-center gap-2 hover:bg-ink/90 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              {isQuerying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
              EXECUTE
            </button>
          </form>

          {/* Response Area */}
          <div className="flex-1 flex flex-col gap-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-500/10 border-2 border-red-500 p-4 flex items-center gap-3 text-red-700 font-mono text-xs uppercase"
                >
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  {error}
                </motion.div>
              )}
              
              {answer ? (
                <motion.section 
                  key="answer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border-2 border-ink p-8 shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] selection:bg-ink selection:text-white"
                >
                  <div className="flex items-center justify-between mb-6 border-b border-line pb-2">
                    <h2 className="font-serif italic text-2xl">Artemis Synthetic Output</h2>
                    <span className="font-mono text-[10px] border border-ink/20 px-2 py-1 rounded">DH-404-GEN</span>
                  </div>
                  <div className="prose prose-slate max-w-none font-sans leading-relaxed text-lg whitespace-pre-wrap">
                    {answer}
                  </div>
                </motion.section>
              ) : isQuerying ? (
                <motion.div 
                  key="loading"
                  className="flex-1 bg-white/50 border-2 border-dashed border-ink/20 flex flex-col items-center justify-center gap-4 py-20"
                >
                  <Loader2 className="w-12 h-12 animate-spin opacity-20" />
                  <p className="font-mono text-xs uppercase tracking-tighter opacity-40">Synthesizing response across vector space...</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  className="flex-1 bg-white/50 border-2 border-dashed border-ink/20 flex flex-col items-center justify-center gap-4 py-20"
                >
                  <Search className="w-12 h-12 opacity-10" />
                  <p className="font-mono text-xs uppercase tracking-tighter opacity-30 text-center max-w-xs">
                    {files.length > 0 ? "Forge operational. Awaiting vector probe." : "Initialize systems by uploading knowledge data."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Context Sources */}
            {results.length > 0 && (
              <section>
                <h3 className="font-mono text-[10px] uppercase tracking-widest opacity-40 mb-3 ml-1 flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-ink/20" />
                  Source Attribution ({results.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {results.map((res, i) => (
                    <div key={i} className="bg-white/70 border border-line p-4 text-[11px] flex flex-col gap-2">
                      <div className="flex items-center justify-between font-mono opacity-50">
                        <span>Chunk #{i+1}</span>
                        <span>{Math.round(res.score * 100)}% Match</span>
                      </div>
                      <p className="line-clamp-4 font-serif italic text-sm">{res.content}</p>
                      <div className="mt-auto pt-2 border-t border-line/50 font-mono text-[10px] uppercase opacity-40 truncate">
                        {res.metadata.filename}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-ink pt-4 flex flex-col md:flex-row justify-between items-center gap-4 opacity-40">
        <div className="font-mono text-[10px] flex gap-6 uppercase">
          <span>Build: Artemis-RAG_V1.0</span>
          <span>Arch: Node/Express/Vite</span>
          <span>Vector: Cosine-Memory</span>
        </div>
        <div className="font-serif italic text-sm underline decoration-red-500 decoration-2 underline-offset-4">
          Developed by Dhruv
        </div>
      </footer>
    </div>
  );
}
