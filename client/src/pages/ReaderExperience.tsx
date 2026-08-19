import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Bookmark, FileText, Maximize2, Minimize2, Minus, Plus, ScanLine, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { ContinuousPdfReader, clampReaderProgress } from "@/components/ContinuousPdfReader";
import { PageFrame } from "@/components/OdhyayShell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { readerPdfUrl } from "@/lib/pdfReader";
import { loadReaderTheme, persistReaderTheme, type ReaderTheme } from "@/lib/readerTheme";
import { trpc } from "@/lib/trpc";

type RecordBook = { id: number; title: string; slug: string; description: string; coverUrl: string | null; pdfKey: string | null; pdfFilename: string | null; pdfMimeType: string | null; pdfSize: number | null; pageCount: number; authorName: string; categoryName: string | null };
const readerThemes: Record<ReaderTheme, { label: string; room: string }> = { dark: { label: "Night", room: "reader-room-night" }, daylight: { label: "Daylight", room: "reader-room-daylight" }, sepia: { label: "Sepia", room: "reader-room-sepia" } };
const PROGRESS_DEBOUNCE_MS = 650;

function ReaderFallback({ loading, onRetry }: { loading: boolean; onRetry: () => void }) {
  if (loading) return <PageFrame><main className="container py-24"><div role="status" className="loading-shimmer border hairline od-surface px-6 py-14"><p className="eyebrow od-accent">Reading room</p><p className="mt-5 text-sm od-muted">Opening your book…</p></div></main></PageFrame>;
  return <PageFrame><main className="container py-24"><div role="alert" className="border od-border-strong od-surface px-6 py-12 text-center"><p className="font-display text-3xl od-ink">This reading room is unavailable.</p><p className="mx-auto mt-3 max-w-md text-sm leading-7 od-muted">Please refresh the book details and try again.</p><button onClick={onRetry} className="focus-ring od-button od-button-outline mt-7">Try again</button></div></main></PageFrame>;
}

function ReaderPreview({ book, readingTheme, page, onPage }: { book: RecordBook; readingTheme: ReaderTheme; page: number; onPage: (page: number) => void }) {
  return <article className="reader-paper reader-paper-surface reader-preview-page w-full max-w-[760px] px-6 py-10 sm:px-14 sm:py-16 lg:px-24 lg:py-24"><p className="text-[.63rem] font-bold uppercase tracking-[.2em] opacity-60">{book.categoryName ?? "Other"} · Reading preview</p><h1 className="font-display mt-8 text-4xl leading-tight sm:text-5xl">{book.title}</h1><p className="mt-4 text-sm opacity-65">{book.authorName}</p><div className="my-10 border-t border-current/15 sm:my-12" /><p className="font-display text-[1.12rem] leading-[1.95] sm:text-[1.3rem] sm:leading-[2]">{book.description}</p><aside className="mt-10 flex gap-4 border-y border-current/15 py-5"><FileText size={18} className="mt-1 shrink-0 opacity-65" /><div><p className="text-sm font-semibold">Document preview</p><p className="mt-2 text-sm leading-7 opacity-70">A full PDF will appear here after an administrator adds it. Until then, you can read the book’s introduction without losing your place.</p></div></aside><button type="button" onClick={() => onPage(1)} className="sr-only">Reset preview reading position</button><div className="mt-20 flex justify-between border-t border-current/15 pt-5 text-[.63rem] font-bold uppercase tracking-[.16em] opacity-55"><span>{readerThemes[readingTheme].label} reading room</span><span>Page {page}</span></div></article>;
}

export default function ReaderExperience() {
  const [, params] = useRoute("/read/:slug");
  const slug = params?.slug;
  const bookQueryInput = useMemo(() => ({ slug: slug ?? "route-pending" }), [slug]);
  const bookQueryOptions = useMemo(() => ({ enabled: Boolean(slug) }), [slug]);
  const detail = trpc.library.getBySlug.useQuery(bookQueryInput, bookQueryOptions);
  const { isAuthenticated } = useAuth();
  const book = detail.data as RecordBook | undefined;
  const progressQueryInput = useMemo(() => ({ bookId: book?.id ?? 0 }), [book?.id]);
  const progressQueryOptions = useMemo(() => ({ enabled: Boolean(book && isAuthenticated) }), [book, isAuthenticated]);
  const progressQuery = trpc.reader.getProgress.useQuery(progressQueryInput, progressQueryOptions);
  const saveProgress = trpc.reader.saveProgress.useMutation();
  const saveBookmark = trpc.reader.addBookmark.useMutation({ onSuccess: () => toast.success("Bookmark saved."), onError: () => toast.error("Please sign in to save bookmarks.") });
  const [zoom, setZoom] = useState(1);
  const [readingTheme, setReadingTheme] = useState<ReaderTheme>(loadReaderTheme);
  const [pdfPages, setPdfPages] = useState(0);
  const [visiblePage, setVisiblePage] = useState(1);
  const [progress, setProgress] = useState(0);
  const [chromeHidden, setChromeHidden] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const readerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const latestReading = useRef({ page: 1, percentage: 0 });
  const lastSavedReading = useRef({ page: 1, percentage: 0 });
  const initializedBookId = useRef<number | null>(null);
  const persistProgressRef = useRef<(force?: boolean) => void>(() => undefined);
  const activeTheme = readerThemes[readingTheme];
  const pdfUrl = book?.pdfKey ? readerPdfUrl(book.slug) : null;
  const savedReading = progressQuery.data;
  const resumePage = Math.max(1, Math.min(pdfPages || book?.pageCount || 1, savedReading?.currentPage ?? 1));
  const resumeProgress = clampReaderProgress(savedReading?.progressPercentage);

  useEffect(() => { persistReaderTheme(readingTheme); }, [readingTheme]);
  useEffect(() => {
    if (!book || (isAuthenticated && progressQuery.isLoading) || initializedBookId.current === book.id) return;
    initializedBookId.current = book.id;
    const restoredPage = Math.max(1, savedReading?.currentPage ?? 1);
    const restoredProgress = clampReaderProgress(savedReading?.progressPercentage);
    setPdfPages(0);
    setVisiblePage(restoredPage);
    setProgress(restoredProgress);
    latestReading.current = { page: restoredPage, percentage: restoredProgress };
    lastSavedReading.current = { page: restoredPage, percentage: restoredProgress };
  }, [book?.id, isAuthenticated, progressQuery.isLoading, savedReading?.currentPage, savedReading?.progressPercentage]);

  const persistLatestProgress = useCallback((force = false) => {
    if (!book || !isAuthenticated) return;
    const latest = latestReading.current;
    const previous = lastSavedReading.current;
    const hasMeaningfulChange = latest.page !== previous.page || Math.abs(latest.percentage - previous.percentage) >= 1;
    if (!force && !hasMeaningfulChange) return;
    lastSavedReading.current = latest;
    saveProgress.mutate({ bookId: book.id, currentPage: Math.max(1, latest.page), progressPercentage: clampReaderProgress(latest.percentage) });
  }, [book, isAuthenticated, saveProgress]);
  persistProgressRef.current = persistLatestProgress;

  useEffect(() => {
    const timer = window.setTimeout(() => persistProgressRef.current(), PROGRESS_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [progress, visiblePage]);

  useEffect(() => {
    const flush = () => persistProgressRef.current(true);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  useEffect(() => {
    const onWindowScroll = () => {
      const position = window.scrollY;
      const down = position > lastScrollY.current + 10;
      const up = position < lastScrollY.current - 10;
      if (down && position > 96) setChromeHidden(true);
      if (up || position < 56) setChromeHidden(false);
      lastScrollY.current = position;
    };
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", onWindowScroll);
  }, []);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === readerRef.current);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const receiveVisiblePage = useCallback((nextPage: number) => {
    setVisiblePage(nextPage);
    latestReading.current = { ...latestReading.current, page: nextPage };
  }, []);
  const receiveProgress = useCallback((percentage: number) => {
    const next = clampReaderProgress(percentage);
    setProgress(next);
    latestReading.current = { ...latestReading.current, percentage: next };
  }, []);
  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await readerRef.current?.requestFullscreen();
    } catch {
      toast.error("Full-screen reading is not available in this browser.");
    }
  }, []);

  if (!slug || !book) return <ReaderFallback loading={detail.isLoading} onRetry={() => void detail.refetch()} />;

  const cycleReadingTheme = () => setReadingTheme(current => current === "dark" ? "daylight" : current === "daylight" ? "sepia" : "dark");
  const bookmark = () => {
    if (!isAuthenticated) {
      toast.info("Sign in to keep your place with a bookmark.");
      return;
    }
    saveBookmark.mutate({ bookId: book.id, pageNumber: Math.max(1, visiblePage) });
  };
  const readerIsRestoring = Boolean(pdfUrl && isAuthenticated && progressQuery.isLoading);

  return <div ref={readerRef} className={`reader-shell reader-continuous-shell min-h-screen ${activeTheme.room} ${isFullscreen ? "reader-fullscreen" : ""}`}>
    <header className={`reader-chrome reader-continuous-chrome ${chromeHidden ? "reader-chrome-hidden" : ""}`}>
      <div className="reader-chrome-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
      <div className="reader-chrome-inner">
        <Link href={`/book/${book.slug}`} className="focus-ring reader-back-link" aria-label="Back to book details"><ArrowLeft size={17} /><span>Back</span></Link>
        <div className="reader-book-identity"><span className="reader-book-title">{book.title}</span><span className="reader-book-progress" aria-live="polite">{progress}%</span></div>
        <div className="reader-minimal-controls">
          <button type="button" className="focus-ring od-icon-button" onClick={() => setZoom(value => Math.max(.8, Number((value - .1).toFixed(1))))} disabled={zoom <= .8} aria-label="Zoom out" title="Zoom out"><Minus size={16} /></button>
          <button type="button" className="focus-ring reader-zoom-display" onClick={() => setZoom(1)} aria-label="Fit pages to width" title="Fit pages to width"><ScanLine size={16} /><span>{Math.round(zoom * 100)}%</span></button>
          <button type="button" className="focus-ring od-icon-button" onClick={() => setZoom(value => Math.min(1.35, Number((value + .1).toFixed(1))))} disabled={zoom >= 1.35} aria-label="Zoom in" title="Zoom in"><Plus size={16} /></button>
          <button type="button" className="focus-ring od-icon-button" onClick={cycleReadingTheme} aria-label={`Change reading paper appearance, currently ${activeTheme.label}`} title="Change reading paper appearance"><Sparkles size={16} /></button>
          <ThemeToggle compact />
          <button type="button" className="focus-ring od-icon-button" onClick={bookmark} disabled={saveBookmark.isPending} aria-label={isAuthenticated ? "Save bookmark" : "Sign in to save bookmark"} title={isAuthenticated ? "Save bookmark" : "Sign in to save bookmark"}><Bookmark size={16} /></button>
          <button type="button" className="focus-ring od-icon-button reader-fullscreen-toggle" onClick={toggleFullscreen} aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"} title={isFullscreen ? "Exit full screen" : "Enter full screen"}>{isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
        </div>
      </div>
    </header>
    <main className="reader-continuous-main">
      <p className="reader-continuous-meta">{book.categoryName ?? "Other"} <span aria-hidden="true">·</span> Page {visiblePage}{pdfPages ? ` of ${pdfPages}` : ""}</p>
      {readerIsRestoring ? <div className="reader-document-loading"><span className="loading-shimmer">Restoring your place…</span></div> : pdfUrl ? <ContinuousPdfReader key={`${book.id}-${resumePage}-${resumeProgress}`} url={pdfUrl} zoom={zoom} initialPage={resumePage} initialProgress={resumeProgress} scrollContainer={isFullscreen ? readerRef.current : null} onPageCount={setPdfPages} onVisiblePage={receiveVisiblePage} onProgress={receiveProgress} onLoadError={message => console.warn("[Reader]", message)} /> : <ReaderPreview book={book} readingTheme={readingTheme} page={visiblePage} onPage={receiveVisiblePage} />}
    </main>
  </div>;
}
