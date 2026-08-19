import React, { useEffect, useRef, useState } from "react";
import { FileWarning, RefreshCw } from "lucide-react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { readerPdfErrorMessage } from "@/lib/pdfReader";

GlobalWorkerOptions.workerSrc = workerUrl;

type PdfDocumentProps = {
  url: string;
  pageNumber: number;
  zoom: number;
  onPageCount: (count: number) => void;
  immersive?: boolean;
};

export function PdfDocument({ url, pageNumber, zoom, onPageCount, immersive = false }: PdfDocumentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const updateWidth = () => setContainerWidth(Math.max(260, element.clientWidth));
    updateWidth();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<unknown> } | undefined;
    const loadingTask = getDocument({ url, withCredentials: true });

    async function renderPage() {
      setLoading(true);
      setError(null);
      try {
        const document = await loadingTask.promise;
        if (cancelled) return;
        onPageCount(document.numPages);
        const pdfPage = await document.getPage(Math.min(Math.max(1, pageNumber), document.numPages));
        const width = Math.max(260, containerWidth || containerRef.current?.clientWidth || 720);
        const initialViewport = pdfPage.getViewport({ scale: 1 });
        const availableHeight = containerRef.current?.clientHeight || window.innerHeight;
        const scale = (immersive ? Math.min(width / initialViewport.width, availableHeight / initialViewport.height) : Math.min(width / initialViewport.width, 1.35)) * zoom;
        const viewport = pdfPage.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d", { alpha: false });
        if (!canvas || !context || cancelled) return;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        renderTask = pdfPage.render({ canvas, canvasContext: context, viewport, transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0] });
        await renderTask.promise;
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "The PDF could not be rendered.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void renderPage();
    return () => {
      cancelled = true;
      renderTask?.cancel();
      void loadingTask.destroy();
    };
  }, [attempt, containerWidth, immersive, onPageCount, pageNumber, url, zoom]);

  if (error) {
    return <section role="alert" className="px-6 py-12 text-center sm:px-10"><FileWarning size={26} className="mx-auto od-accent" /><p className="mt-5 font-display text-2xl od-ink">This page could not open.</p><p className="mx-auto mt-3 max-w-md text-sm leading-7 od-muted">{readerPdfErrorMessage(error)}</p><div className="mt-7 flex flex-wrap justify-center gap-4"><button onClick={() => setAttempt(value => value + 1)} className="focus-ring inline-flex min-h-10 items-center gap-2 border od-border-strong px-3 py-2 text-xs font-semibold od-ink hover:border-amethyst"><RefreshCw size={14} /> Try again</button><a href={url} target="_blank" rel="noreferrer" className="focus-ring inline-flex min-h-10 items-center border-b border-current px-1 py-2 text-xs font-semibold od-accent">Open the PDF in a new tab</a></div></section>;
  }

  return <div ref={containerRef} className={`reader-pdf-surface relative flex min-h-[360px] w-full items-center justify-center overflow-auto p-2 sm:min-h-[420px] sm:p-6 ${immersive ? "reader-pdf-immersive" : ""}`} aria-busy={loading} aria-live="polite"><canvas ref={canvasRef} className="block max-w-none shadow-[0_12px_32px_var(--od-shadow)]" aria-label={`PDF page ${pageNumber}`} />{loading && <div className="absolute inset-0 grid place-items-center od-surface-raised-overlay"><span className="loading-shimmer px-4 py-3 text-xs font-semibold uppercase tracking-[.16em] od-muted">Rendering page {pageNumber}…</span></div>}</div>;
}
