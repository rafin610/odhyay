import React, { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, ArrowRight, Bookmark, Expand, FileText, Minus, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { PdfDocument } from "@/components/PdfDocument";
import { Mark, PageFrame } from "@/components/OdhyayShell";
import { readerPdfUrl } from "@/lib/pdfReader";
import { trpc } from "@/lib/trpc";

type RecordBook = {
  id: number;
  title: string;
  slug: string;
  description: string;
  coverUrl: string | null;
  pdfKey: string | null;
  pdfFilename: string | null;
  pdfMimeType: string | null;
  pdfSize: number | null;
  pageCount: number;
  authorName: string;
  categoryName: string | null;
};

type ReaderTheme = "dark" | "daylight" | "sepia";

const readerThemes: Record<ReaderTheme, { label: string; room: string; paper: string; chrome: string }> = {
  dark: { label: "Night", room: "bg-[#111015] text-[#eee9f0]", paper: "bg-[#211e25] text-[#d9d2d8]", chrome: "border-white/10 bg-[#111015]/92" },
  daylight: { label: "Daylight", room: "bg-[#d9d0bd] text-[#403a38]", paper: "bg-[#eee8da] text-[#413c38]", chrome: "border-[#706a60]/20 bg-[#eee8da]/90" },
  sepia: { label: "Sepia", room: "bg-[#3b3026] text-[#f1dfbd]", paper: "bg-[#e1cfaa] text-[#483d32]", chrome: "border-[#f1dfbd]/15 bg-[#30261f]/92" },
};

function ReaderFallback({ loading, onRetry }: { loading: boolean; onRetry: () => void }) {
  if (loading) return <PageFrame><main className="container py-24"><div role="status" className="loading-shimmer border hairline bg-[#151219] px-6 py-14"><p className="eyebrow text-amethyst">Reading room</p><p className="mt-5 text-sm text-[#a39aa9]">Opening your book…</p></div></main></PageFrame>;
  return <PageFrame><main className="container py-24"><div role="alert" className="border border-[#5c3a48] bg-[#25171f] px-6 py-12 text-center"><p className="font-display text-3xl text-[#f0dce5]">This reading room is unavailable.</p><p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#d7b7c2]">Please refresh the book details and try again.</p><button onClick={onRetry} className="focus-ring mt-7 min-h-10 border border-[#735160] px-4 py-2 text-xs font-semibold text-[#f2dce6] hover:border-[#b7a4d7]">Try again</button></div></main></PageFrame>;
}

function ReaderToolbar({ page, pages, zoom, isAuthenticated, bookmarkPending, onPage, onZoom, onTheme, onBookmark }: { page: number; pages: number; zoom: number; isAuthenticated: boolean; bookmarkPending: boolean; onPage: (page: number) => void; onZoom: (zoom: number) => void; onTheme: () => void; onBookmark: () => void }) {
  return <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#3d3547] bg-[#17141c]/95 px-3 py-3 backdrop-blur-xl md:bottom-5 md:left-1/2 md:right-auto md:w-auto md:-translate-x-1/2 md:rounded-sm md:border"><div className="safe-bottom flex items-center justify-center gap-1 text-[#d7cedb]"><button className="focus-ring grid size-10 place-items-center disabled:opacity-30" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1} aria-label="Previous page" title="Previous page"><ArrowLeft size={16} /></button><span className="mx-1 min-w-[58px] border-x border-[#3a3242] px-2 text-center text-xs">{page} <span className="text-[#746c7d]">/ {pages}</span></span><button className="focus-ring grid size-10 place-items-center disabled:opacity-30" onClick={() => onPage(Math.min(pages, page + 1))} disabled={page === pages} aria-label="Next page" title="Next page"><ArrowRight size={16} /></button><button className="focus-ring grid size-10 place-items-center" onClick={onTheme} aria-label="Change reading theme" title="Change reading theme"><Sparkles size={16} /></button><button className="focus-ring grid size-10 place-items-center text-amethyst disabled:opacity-40" onClick={onBookmark} disabled={bookmarkPending} aria-label={isAuthenticated ? "Save bookmark" : "Sign in to save bookmark"} title={isAuthenticated ? "Save bookmark" : "Sign in to save bookmark"}><Bookmark size={16} /></button><span className="mx-1 hidden h-5 w-px bg-[#3a3242] sm:block" /><button className="focus-ring hidden size-10 place-items-center sm:grid" onClick={() => onZoom(Math.max(.8, zoom - .1))} aria-label="Zoom out" title="Zoom out"><Minus size={16} /></button><button className="focus-ring hidden size-10 place-items-center sm:grid" onClick={() => onZoom(Math.min(1.35, zoom + .1))} aria-label="Zoom in" title="Zoom in"><Plus size={16} /></button><button className="focus-ring hidden size-10 place-items-center sm:grid" onClick={() => document.documentElement.requestFullscreen?.()} aria-label="Enter full screen" title="Enter full screen"><Expand size={16} /></button></div></div>;
}

export default function ReaderExperience() {
  const [, params] = useRoute("/read/:slug");
  const slug = params?.slug;
  const detail = trpc.library.getBySlug.useQuery({ slug: slug ?? "route-pending" }, { enabled: Boolean(slug) });
  const { isAuthenticated } = useAuth();
  const saveProgress = trpc.reader.saveProgress.useMutation();
  const saveBookmark = trpc.reader.addBookmark.useMutation({ onSuccess: () => toast.success("Bookmark saved."), onError: () => toast.error("Please sign in to save bookmarks.") });
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pdfPages, setPdfPages] = useState(0);
  const [theme, setTheme] = useState<ReaderTheme>(() => {
    const stored = localStorage.getItem("odhyay-reader-theme");
    return stored === "daylight" || stored === "sepia" ? stored : "dark";
  });
  const book = detail.data as RecordBook | undefined;
  const pdfUrl = book?.pdfKey ? readerPdfUrl(book.slug) : null;
  const pages = pdfPages || Math.max(1, book?.pageCount ?? 1);
  const activeTheme = readerThemes[theme];
  const progress = Math.round((page / pages) * 100);

  useEffect(() => { localStorage.setItem("odhyay-reader-theme", theme); }, [theme]);
  useEffect(() => { setPdfPages(0); setPage(1); }, [book?.id, book?.pdfKey]);
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);
  useEffect(() => { if (book && isAuthenticated) saveProgress.mutate({ bookId: book.id, currentPage: page, progressPercentage: progress }); }, [book?.id, isAuthenticated, page, progress]);

  if (!slug || !book) return <ReaderFallback loading={detail.isLoading} onRetry={() => void detail.refetch()} />;

  const cycleTheme = () => setTheme(current => current === "dark" ? "daylight" : current === "daylight" ? "sepia" : "dark");
  const bookmark = () => {
    if (!isAuthenticated) { toast.info("Sign in to keep your place with a bookmark."); return; }
    saveBookmark.mutate({ bookId: book.id, pageNumber: page });
  };

  return <div className={`min-h-screen ${activeTheme.room}`}><header className={`sticky top-0 z-30 ${activeTheme.chrome} border-b backdrop-blur-xl`}><div className="flex h-[66px] items-center justify-between px-4 sm:px-6 md:px-8"><Link href={`/book/${book.slug}`} className="focus-ring flex min-h-10 items-center gap-2 text-xs font-semibold"><ArrowLeft size={16} /><span className="hidden sm:inline">Back to book</span></Link><div className="flex min-w-0 items-center gap-2 sm:gap-3"><Mark small /><span className="font-display truncate text-[.95rem] tracking-[.14em] sm:text-lg">ODHYAY</span></div><span className="text-xs opacity-65">{activeTheme.label}</span></div><div className="h-px bg-current/10"><div className="h-full bg-[#b7a4d7] transition-[width] duration-200" style={{ width: `${progress}%` }} /></div></header><main className="flex min-h-[calc(100vh-67px)] flex-col items-center px-4 pb-28 pt-8 sm:pt-10 md:pt-14"><div className="mb-5 flex w-full max-w-[760px] items-center justify-between gap-4 text-[.62rem] font-bold uppercase tracking-[.16em] opacity-60"><span className="truncate">Reading · {book.categoryName ?? "Other"}</span><span className="shrink-0">{progress}% complete</span></div><article className={`reader-paper w-full max-w-[760px] ${pdfUrl ? "overflow-hidden" : "px-6 py-10 sm:px-14 sm:py-16 lg:px-24 lg:py-24"} ${activeTheme.paper}`} style={pdfUrl ? undefined : { transform: `scale(${zoom})`, transformOrigin: "top center", marginBottom: `${Math.max(0, zoom - 1) * 850}px` }}>{pdfUrl ? <PdfDocument url={pdfUrl} pageNumber={page} zoom={zoom} onPageCount={setPdfPages} /> : <section><p className="text-[.63rem] font-bold uppercase tracking-[.2em] opacity-60">{book.categoryName ?? "Other"} · Reading preview</p><h1 className="font-display mt-8 text-4xl leading-tight sm:text-5xl">{book.title}</h1><p className="mt-4 text-sm opacity-65">{book.authorName}</p><div className="my-10 border-t border-current/15 sm:my-12" /><p className="font-display text-[1.12rem] leading-[1.95] sm:text-[1.3rem] sm:leading-[2]">{book.description}</p><aside className="mt-10 flex gap-4 border-y border-current/15 py-5"><FileText size={18} className="mt-1 shrink-0 opacity-65" /><div><p className="text-sm font-semibold">Document preview</p><p className="mt-2 text-sm leading-7 opacity-70">A full PDF will appear here after an administrator adds it. Until then, you can read the book’s introduction without losing your place.</p></div></aside><div className="mt-20 flex justify-between border-t border-current/15 pt-5 text-[.63rem] font-bold uppercase tracking-[.16em] opacity-55"><span>ODHYAY</span><span>Page {page}</span></div></section>}</article></main><ReaderToolbar page={page} pages={pages} zoom={zoom} isAuthenticated={isAuthenticated} bookmarkPending={saveBookmark.isPending} onPage={setPage} onZoom={setZoom} onTheme={cycleTheme} onBookmark={bookmark} /></div>;
}
