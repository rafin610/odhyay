import React, { useEffect, useRef, useState } from "react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { readerPdfErrorMessage } from "@/lib/pdfReader";

GlobalWorkerOptions.workerSrc = workerUrl;

type PdfDocumentProps = {
  url: string;
  pageNumber: number;
  zoom: number;
  onPageCount: (count: number) => void;
};

export function PdfDocument({ url, pageNumber, zoom, onPageCount }: PdfDocumentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<unknown> } | undefined;
    const loadingTask = getDocument({ url, withCredentials: true });

    async function renderPage() {
      setLoading(true);
      setError(null);
      try {
        const document = await loadingTask.promise;
        if (cancelled) {
          return;
        }
        onPageCount(document.numPages);
        const pdfPage = await document.getPage(Math.min(Math.max(1, pageNumber), document.numPages));
        const containerWidth = Math.max(260, containerRef.current?.clientWidth ?? 720);
        const initialViewport = pdfPage.getViewport({ scale: 1 });
        const scale = Math.min(containerWidth / initialViewport.width, 1.35) * zoom;
        const viewport = pdfPage.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d", { alpha: false });
        if (!canvas || !context || cancelled) return;
        const pixelRatio = window.devicePixelRatio || 1;
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
  }, [onPageCount, pageNumber, url, zoom]);

  if (error) return <div className="px-7 py-14 text-center text-sm text-[#8f8996]"><p>{readerPdfErrorMessage(error)}</p><a href={url} target="_blank" rel="noreferrer" className="mt-4 inline-block border-b border-current pb-1 text-[#b7a4d7]">Open the PDF in a new tab</a></div>;
  return <div ref={containerRef} className="relative flex min-h-[420px] w-full items-center justify-center overflow-auto bg-[#f5f0e7] p-3 sm:p-6" aria-busy={loading}><canvas ref={canvasRef} className="block max-w-none shadow-[0_12px_32px_rgba(0,0,0,.22)]" aria-label={`PDF page ${pageNumber}`} />{loading && <span className="absolute inset-0 grid place-items-center bg-[#f5f0e7]/80 text-xs font-semibold uppercase tracking-[.16em] text-[#625b64]">Rendering page…</span>}</div>;
}
