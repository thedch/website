import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useCallback, useEffect, useState } from "react";

interface ProgressUpdate {
  progress: number;
  timeElapsed: number;
  text: string;
}

const MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
const MAX_PDF_TOKENS = 2800; // Leave room for system prompt, summary prompt, and response
const APPROX_CHARS_PER_TOKEN = 4;
const MAX_PDF_CHARS = MAX_PDF_TOKENS * APPROX_CHARS_PER_TOKEN;
const SUMMARY_PROMPT =
  "Summarize the following PDF content in a concise paragraph.";

GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function LocalInference() {
  const [isInferencing, setIsInferencing] = useState(false);
  const [engine, setEngine] = useState<MLCEngine | null>(null);
  const [modelResponse, setModelResponse] = useState<string>("");
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [initProgress, setInitProgress] = useState<ProgressUpdate | null>(null);

  const [userInput, setUserInput] = useState<string>("What color is the sun?");
  const [pdfText, setPdfText] = useState<string>("");
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfStatus, setPdfStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfTokenCount, setPdfTokenCount] = useState<number>(0);
  const [isPdfTruncated, setIsPdfTruncated] = useState<boolean>(false);
  const [pdfSummary, setPdfSummary] = useState<string>("");
  const [pdfSummaryError, setPdfSummaryError] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [pendingSummary, setPendingSummary] = useState<boolean>(false);

  useEffect(() => {
    if (engine) return;

    setIsModelLoading(true);
    const initEngine = async () => {
      try {
        const engine = await CreateMLCEngine(MODEL_ID, {
          initProgressCallback: (progress: ProgressUpdate) => {
            setInitProgress(progress);
          },
        });
        setEngine(engine);
      } catch (error) {
        console.error("Failed to initialize MLCEngine:", error);
      } finally {
        setIsModelLoading(false);
      }
    };

    initEngine();
  }, []);

  const handlePdfUpload = useCallback(async (file: File | null) => {
    if (!file) return;

    setPdfStatus("loading");
    setPdfError(null);
    setPdfName(file.name);
    setPdfText("");
    setPdfTokenCount(0);
    setIsPdfTruncated(false);
    setPdfSummary("");
    setPdfSummaryError(null);
    setPendingSummary(false);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      let extractedText = "";
      let truncated = false;

      for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
        const page = await pdf.getPage(pageIndex);
        const textContent = await page.getTextContent();
        const items = textContent.items as Array<{ str?: string }>;
        const pageText = items
          .map((item) => item.str ?? "")
          .join(" ")
          .trim();
        if (pageText) {
          extractedText += `${pageText}\n\n`;
        }

        if (extractedText.length >= MAX_PDF_CHARS) {
          extractedText = extractedText.slice(0, MAX_PDF_CHARS);
          truncated = true;
          break;
        }
      }

      const trimmedText = extractedText.trim();
      if (!trimmedText) {
        setPdfStatus("error");
        setPdfError("No text could be extracted from this PDF.");
        return;
      }

      const approxTokens = Math.ceil(
        trimmedText.length / APPROX_CHARS_PER_TOKEN,
      );
      setPdfText(trimmedText);
      setPdfTokenCount(approxTokens);
      setIsPdfTruncated(truncated);
      setPdfStatus("ready");
      setPendingSummary(true);
    } catch (error) {
      console.error("Failed to read PDF:", error);
      setPdfStatus("error");
      setPdfError("Could not read this PDF. Please try a different file.");
    }
  }, []);

  useEffect(() => {
    if (
      !engine ||
      !pendingSummary ||
      !pdfText ||
      isInferencing ||
      isSummarizing
    ) {
      return;
    }

    const summarizePdf = async () => {
      setIsSummarizing(true);
      setPdfSummaryError(null);
      try {
        const prompt = `${SUMMARY_PROMPT}\n\n${pdfText}`;
        const messages = [
          {
            role: "system" as const,
            content: "You are a helpful AI assistant.",
          },
          { role: "user" as const, content: prompt },
        ];
        const reply = await engine.chat.completions.create({ messages });
        setPdfSummary(reply.choices[0].message.content || "");
      } catch (error) {
        console.error("PDF summary failed:", error);
        setPdfSummaryError("Failed to summarize this PDF.");
      } finally {
        setIsSummarizing(false);
        setPendingSummary(false);
      }
    };

    void summarizePdf();
  }, [engine, isInferencing, isSummarizing, pdfText, pendingSummary]);

  const runInference = useCallback(async () => {
    if (!engine || isInferencing || isSummarizing) return;

    setIsInferencing(true);
    try {
      const messages = [
        { role: "system" as const, content: "You are a helpful AI assistant." },
        { role: "user" as const, content: userInput },
      ];

      const startTime = performance.now();
      const reply = await engine.chat.completions.create({ messages });
      const endTime = performance.now();
      const timeElapsed = endTime - startTime;
      const generatedTokens = reply.usage?.completion_tokens || 0;
      const promptTokens = reply.usage?.prompt_tokens || 0;
      const msg = `Time: ${timeElapsed.toFixed(1)}ms, Output Tokens: ${generatedTokens}, Prompt Tokens: ${promptTokens}`;

      setModelResponse(reply.choices[0].message.content + "\n\n" + msg);
    } catch (error) {
      console.error("Model chat failed:", error);
      setModelResponse("Failed to get response from model");
    } finally {
      setIsInferencing(false);
    }
  }, [engine, isInferencing, isSummarizing, userInput]);

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="mb-4 text-2xl font-bold text-black dark:text-white">
        Model: {MODEL_ID}
      </h2>
      <div className="mt-4 w-full max-w-2xl rounded-lg bg-neutral-100 p-4 dark:bg-neutral-900">
        <div className="mb-4">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="w-full rounded border border-black/15 bg-white p-2 text-black dark:border-white/20 dark:bg-neutral-800 dark:text-white"
            rows={4}
            placeholder="Enter your message here..."
            disabled={isModelLoading || isInferencing || isSummarizing}
          />
          <button
            onClick={runInference}
            disabled={
              isModelLoading || isInferencing || isSummarizing || !engine
            }
            className={`mt-2 rounded bg-blue-500 px-4 py-2 text-white transition-colors ${
              isModelLoading || isInferencing || isSummarizing || !engine
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-blue-600"
            }`}
          >
            {isInferencing ? "Generating..." : "Generate Response"}
          </button>
        </div>

        {isModelLoading && (
          <div className="text-black/60 dark:text-white/60">
            <div>Loading model...</div>
            {initProgress && (
              <div className="mt-2">
                <div>Progress: {(initProgress.progress * 100).toFixed(2)}%</div>
                <div>Time Elapsed: {initProgress.timeElapsed.toFixed(1)}s</div>
                <div>Status: {initProgress.text}</div>
              </div>
            )}
          </div>
        )}

        {!isModelLoading && (
          <>
            {modelResponse && (
              <h3 className="mb-2 font-bold text-black dark:text-white">
                Model Response:
              </h3>
            )}
            {isInferencing ? (
              <div className="text-black/60 dark:text-white/60">
                Generating response...
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-black dark:text-white">
                {modelResponse}
              </div>
            )}
          </>
        )}

        <div className="mt-6 border-t border-black/10 pt-4 dark:border-white/10">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-black dark:text-white">
              Upload a PDF
            </label>
            <div className="relative">
              <input
                type="file"
                accept="application/pdf"
                id="pdf-upload"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                disabled={
                  isModelLoading || isSummarizing || pdfStatus === "loading"
                }
                onChange={(event) =>
                  void handlePdfUpload(event.target.files?.[0] ?? null)
                }
              />
              <label
                htmlFor="pdf-upload"
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-black/20 bg-neutral-50 px-4 py-3 text-sm font-medium text-black transition-all hover:border-blue-500/50 hover:bg-blue-50/50 dark:border-white/20 dark:bg-neutral-900 dark:text-white dark:hover:border-blue-400/50 dark:hover:bg-blue-950/30 ${
                  isModelLoading || isSummarizing || pdfStatus === "loading"
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="truncate">
                  {pdfStatus === "ready" && pdfName
                    ? pdfName
                    : "Choose PDF file"}
                </span>
              </label>
            </div>
            {pdfStatus === "loading" && (
              <div className="text-sm text-black/60 dark:text-white/60">
                Reading PDF content...
              </div>
            )}
            {pdfStatus === "error" && pdfError && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {pdfError}
              </div>
            )}
            {pdfStatus === "ready" && pdfName && (
              <div className="text-sm text-black/60 dark:text-white/60">
                Loaded: {pdfName} · ~{pdfTokenCount.toLocaleString()} tokens
                {isPdfTruncated &&
                  ` (truncated to ~${MAX_PDF_TOKENS.toLocaleString()} tokens)`}
              </div>
            )}
            {isSummarizing && (
              <div className="text-sm text-black/60 dark:text-white/60">
                Generating summary...
              </div>
            )}
            {pdfSummaryError && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {pdfSummaryError}
              </div>
            )}
            {pdfSummary && (
              <div className="rounded border border-black/10 bg-white p-3 text-sm text-black dark:border-white/10 dark:bg-neutral-800 dark:text-white">
                <div className="mb-2 font-semibold">PDF Summary</div>
                <div className="whitespace-pre-wrap">{pdfSummary}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
