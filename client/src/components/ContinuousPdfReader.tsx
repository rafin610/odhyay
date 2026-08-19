import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FileWarning, RefreshCw } from "lucide-react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { readerPdfErrorMessage } from "@/lib/pdfReader";
import { clampReaderProgress, renderPixelRatio } from "@/lib/readerCanvas";

GlobalWorkerOptions.workerSrc = workerUrl;

type PdfDocumentProxy = Awaited<ReturnType<typeof getDocument>["promise"]>;
type PdfPageProxy = Awaited<ReturnType<PdfDocumentProxy["getPage"]>>;

type PageMetric = {
  width: number;
  height: number;
};

type ContinuousPdfReaderProps = {
  url: string;
  zoom: number;
  initialPage?: number;
  initialProgress?: number;
  onPageCount: (count: number) => void;
  onVisiblePage: (page: number) => void;
  onProgress: (percentage: number) => void;
  onLoadError?: (message: string) => void;
};

const DEFAULT_PAGE_METRIC: PageMetric = { width: 612, height: 792 };
const PREFETCH_DISTANCE = "1100px 0px";
export { clampReaderProgress, renderPixelRatio } from "@/lib/readerCanvas";

function samePageSet(left: Set<number>, right: Set<number>) {
  return left.size === right.size && Array.from(left).every(page => right.has(page));
}

function PdfCanvasPage({ pageNumber, pdf, metric, width, active, onError }: { pageNumber: number; pdf: PdfDocumentProxy; metric: PageMetric; width: number; active: boolean; onError: (message: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!active || width <= 0) return;

    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<unknown> } | undefined;
    let pageProxy: PdfPageProxy | undefined;

    async function renderPage() {
      setIsRendering(true);
      setError(null);
      try {
        pageProxy = await pdf.getPage(pageNumber);
        if (cancelled) return;
        const baseViewport = pageProxy.getViewport({ scale: 1 });
        const cssScale = width / baseViewport.width;
        const viewport = pageProxy.getViewport({ scale: cssScale });
        const pixelRatio = renderPixelRatio(viewport.width, viewport.height, window.devicePixelRatio || 1);
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d", { alpha: false });
        if (!canvas || !context || cancelled) return;

        canvas.width = Math.max(1, Math.floor(viewport.width * pixelRatio));
        canvas.height = Math.max(1, Math.floor(viewport.height * pixelRatio));
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        renderTask = pageProxy.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        });
        await renderTask.promise;
      } catch (cause) {
        if (!cancelled) {
          const message = cause instanceof Error ? cause.message : `Page ${pageNumber} could not be rendered.`;
          setError(message);
          onError(message);
        }
      } finally {
        if (!cancelled) setIsRendering(false);
      }
    }

    void renderPage();
    return () => {
      cancelled = true;
      renderTask?.cancel();
      pageProxy?.cleanup();
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = 1;
        canvas.height = 1;
      }
    };
  }, [active, attempt, metric.height, metric.width, onError, pageNumber, pdf, width]);

  if (!active) return null;

  if (error) {
    return <div className="reader-page-render-error" role="alert"><FileWarning size={18} /><span>Page {pageNumber} could not render.</span><button type="button" className="focus-ring" onClick={() => { setError(null); setAttempt(value => value + 1); }} aria-label={`Retry page ${pageNumber}`}><RefreshCw size={15} /> Retry</button></div>;
  }

  return <>
    <canvas ref={canvasRef} className="reader-pdf-page-canvas" aria-label={`PDF page ${pageNumber}`} />
    {isRendering && <div className="reader-page-rendering" aria-live="polite"><span className="loading-shimmer">Rendering page {pageNumber}…</span></div>}
  </>;
}

export function ContinuousPdfReader({ url, zoom, initialPage = 1, initialProgress = 0, onPageCount, onVisiblePage, onProgress, onLoadError }: ContinuousPdfReaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pageElements = useRef(new Map<number, HTMLDivElement>());
  const activeByObserver = useRef(new Set<number>());
  const frameId = useRef<number | null>(null);
  const hasRestoredPosition = useRef(false);
  const onLoadErrorRef = useRef(onLoadError);
  const [documentProxy, setDocumentProxy] = useState<PdfDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageMetrics, setPageMetrics] = useState<PageMetric[]>([]);
  const [activePages, setActivePages] = useState<Set<number>>(() => new Set([1, 2, 3]));
  const [containerWidth, setContainerWidth] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const maxViewportWidth = Math.max(260, Math.floor(window.innerWidth - 24));
  const targetColumnWidth = Math.min(Math.round(760 * zoom), maxViewportWidth);
  const pageWidth = Math.max(260, containerWidth || targetColumnWidth);

  const setPageElement = useCallback((page: number, element: HTMLDivElement | null) => {
    if (element) pageElements.current.set(page, element);
    else pageElements.current.delete(page);
  }, []);
  const reportLoadError = useCallback((message: string) => onLoadErrorRef.current?.(message), []);

  useEffect(() => {
    onLoadErrorRef.current = onLoadError;
  }, [onLoadError]);

  useLayoutEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    const updateWidth = () => setContainerWidth(Math.max(260, Math.floor(element.clientWidth)));
    updateWidth();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadingTask = getDocument({ url, withCredentials: true });
    setError(null);
    setDocumentProxy(null);
    setPageCount(0);
    setPageMetrics([]);
    setActivePages(new Set([1, 2, 3]));
    hasRestoredPosition.current = false;

    void loadingTask.promise.then(pdf => {
      if (cancelled) {
        return;
      }
      setDocumentProxy(pdf);
      setPageCount(pdf.numPages);
      onPageCount(pdf.numPages);
    }).catch(cause => {
      if (cancelled) return;
      const message = cause instanceof Error ? cause.message : "The PDF could not be loaded.";
      setError(message);
      reportLoadError(message);
    });

    return () => {
      cancelled = true;
      void loadingTask.destroy();
    };
  }, [attempt, onPageCount, reportLoadError, url]);

  useEffect(() => {
    if (!documentProxy || pageCount === 0) return;
    const pdf = documentProxy;
    let cancelled = false;
    const metrics = Array.from({ length: pageCount }, () => DEFAULT_PAGE_METRIC);

    async function collectPageMetrics() {
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        try {
          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1 });
          page.cleanup();
          metrics[pageNumber - 1] = { width: viewport.width, height: viewport.height };
          if (!cancelled && (pageNumber <= 4 || pageNumber % 8 === 0 || pageNumber === pageCount)) setPageMetrics([...metrics]);
        } catch {
          // Keep a stable portrait placeholder for an unreadable page and allow the page renderer to expose its own recovery state.
        }
      }
    }

    void collectPageMetrics();
    return () => {
      cancelled = true;
    };
  }, [documentProxy, pageCount]);

  const updateViewportState = useCallback(() => {
    frameId.current = null;
    const root = rootRef.current;
    if (!root || pageCount === 0) return;
    const viewportLine = window.innerHeight * 0.34;
    let closestPage = 1;
    let closestDistance = Number.POSITIVE_INFINITY;
    pageElements.current.forEach((element, page) => {
      const rect = element.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const distance = Math.abs(rect.top - viewportLine);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPage = page;
      }
    });
    onVisiblePage(closestPage);

    const rect = root.getBoundingClientRect();
    const readLine = window.scrollY + viewportLine;
    const documentStart = window.scrollY + rect.top;
    const readableDistance = Math.max(1, root.offsetHeight - window.innerHeight * 0.6);
    onProgress(clampReaderProgress(((readLine - documentStart) / readableDistance) * 100));
  }, [onProgress, onVisiblePage, pageCount]);

  const scheduleViewportUpdate = useCallback(() => {
    if (frameId.current !== null) return;
    frameId.current = window.requestAnimationFrame(updateViewportState);
  }, [updateViewportState]);

  useEffect(() => {
    window.addEventListener("scroll", scheduleViewportUpdate, { passive: true });
    window.addEventListener("resize", scheduleViewportUpdate);
    scheduleViewportUpdate();
    return () => {
      window.removeEventListener("scroll", scheduleViewportUpdate);
      window.removeEventListener("resize", scheduleViewportUpdate);
      if (frameId.current !== null) window.cancelAnimationFrame(frameId.current);
    };
  }, [scheduleViewportUpdate]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || pageCount === 0) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const page = Number((entry.target as HTMLElement).dataset.pageNumber);
        if (!page) return;
        if (entry.isIntersecting) activeByObserver.current.add(page);
        else activeByObserver.current.delete(page);
      });
      const next = new Set(activeByObserver.current);
      if (!next.size) next.add(1);
      setActivePages(current => samePageSet(current, next) ? current : next);
      scheduleViewportUpdate();
    }, { rootMargin: PREFETCH_DISTANCE, threshold: 0.01 });
    pageElements.current.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [pageCount, scheduleViewportUpdate]);

  useEffect(() => {
    if (hasRestoredPosition.current || pageCount === 0 || !rootRef.current) return;
    hasRestoredPosition.current = true;
    const restore = window.requestAnimationFrame(() => {
      const root = rootRef.current;
      if (!root) return;
      const safeProgress = clampReaderProgress(initialProgress);
      const top = window.scrollY + root.getBoundingClientRect().top;
      const offset = Math.max(0, (root.offsetHeight - window.innerHeight * 0.6) * (safeProgress / 100));
      if (safeProgress > 0) window.scrollTo({ top: Math.max(0, top + offset - window.innerHeight * 0.12), behavior: "auto" });
      else pageElements.current.get(Math.max(1, Math.min(pageCount, initialPage)))?.scrollIntoView({ block: "start", behavior: "auto" });
      scheduleViewportUpdate();
    });
    return () => window.cancelAnimationFrame(restore);
  }, [initialPage, initialProgress, pageCount, scheduleViewportUpdate]);

  if (error) {
    return <section role="alert" className="reader-document-error"><FileWarning size={28} /><p className="font-display text-2xl">This document could not open.</p><p>{readerPdfErrorMessage(error)}</p><button type="button" className="focus-ring od-button od-button-outline" onClick={() => setAttempt(value => value + 1)}><RefreshCw size={15} /> Try again</button><a className="focus-ring reader-open-original" href={url} target="_blank" rel="noreferrer">Open the original PDF</a></section>;
  }

  return <div ref={rootRef} className="reader-continuous-document" style={{ width: `${targetColumnWidth}px` }} data-zoom={Math.round(zoom * 100)} aria-busy={!documentProxy} aria-live="polite">
    {!documentProxy && <div className="reader-document-loading"><span className="loading-shimmer">Opening your book…</span></div>}
    {documentProxy && Array.from({ length: pageCount }, (_, index) => {
      const pageNumber = index + 1;
      const metric = pageMetrics[index] ?? DEFAULT_PAGE_METRIC;
      const height = containerWidth > 0 ? Math.round(pageWidth * (metric.height / metric.width)) : 360;
      const active = activePages.has(pageNumber) || pageNumber <= 3;
      return <div ref={element => setPageElement(pageNumber, element)} data-page-number={pageNumber} key={pageNumber} className="reader-continuous-page" style={{ width: `${pageWidth}px`, minHeight: `${height}px` }}>
        <span className="reader-page-number" aria-hidden="true">{pageNumber}</span>
        <PdfCanvasPage pageNumber={pageNumber} pdf={documentProxy} metric={metric} width={pageWidth} active={active} onError={reportLoadError} />
      </div>;
    })}
  </div>;
}
