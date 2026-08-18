/* ODHYAY style: Quiet Editorial — persisted records enter the same calm, literary composition used for the public library. */
import React, { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, ArrowRight, Bookmark, BookOpen, ChevronRight, Expand, Filter, Heart, Minus, Plus, RefreshCw, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { PdfDocument } from "@/components/PdfDocument";
import { readerPdfUrl } from "@/lib/pdfReader";
import { loadReaderTheme, persistReaderTheme, type ReaderTheme } from "@/lib/readerTheme";
import { BookGrid, Mark, PageFrame, SearchBar, SectionLabel } from "@/components/OdhyayShell";
import { assets, type Book } from "@/lib/odhyayData";
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
  status: "draft" | "published";
  authorName: string;
  categoryName: string | null;
  categorySlug: string | null;
};

const fallbackCover = assets.cover1;
const toViewBook = (book: RecordBook): Book => ({
  slug: book.slug,
  title: book.title,
  author: book.authorName,
  category: book.categoryName ?? "Other",
  pages: book.pageCount || 1,
  cover: book.coverUrl || fallbackCover,
  description: book.description,
});

function QueryNotice({ loading, error, empty, onRetry }: { loading: boolean; error: unknown; empty: string; onRetry?: () => void }) {
  if (loading) {
    return <div role="status" className="loading-shimmer border hairline bg-[#151219] px-6 py-12 sm:px-8"><div className="h-3 w-28 bg-white/10" /><div className="mt-6 h-8 max-w-sm bg-white/10" /><div className="mt-3 h-4 max-w-lg bg-white/10" /><p className="mt-8 text-sm text-[#b4acbb]">Preparing the shelves…</p></div>;
  }

  if (error) {
    return <div role="alert" className="border border-[#5c3a48] bg-[#25171f] px-6 py-10 sm:px-8"><p className="font-display text-2xl text-[#f0dce5]">The library needs a moment.</p><p className="mt-3 max-w-lg text-sm leading-7 text-[#d7b7c2]">We could not reach the shelf just now. Your place is safe; please try again.</p>{onRetry && <button onClick={onRetry} className="focus-ring mt-6 inline-flex items-center gap-2 border border-[#735160] px-3 py-2 text-xs font-semibold text-[#f2dce6] hover:border-[#b7a4d7]"><RefreshCw size={14} /> Try again</button>}</div>;
  }

  return <div className="border border-dashed border-[#4a4052] bg-[#151219]/40 px-6 py-14 text-center sm:px-10"><Mark /><h2 className="font-display mt-5 text-3xl">{empty}</h2><p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#8f8996]">Your first published book will appear here, ready for a reader to find.</p></div>;
}

function EditorialEmptyShelf() {
  return <div className="grid gap-5 border-y hairline py-10 sm:grid-cols-[auto_1fr_auto] sm:items-center"><div className="flex size-12 items-center justify-center border border-[#4a4052] bg-[#17141c]"><BookOpen size={18} className="text-amethyst" /></div><div><p className="font-display text-2xl">The next chapter is being chosen.</p><p className="mt-2 max-w-xl text-sm leading-7 text-[#928b9a]">This shelf is deliberately quiet for now. Explore the full library, or return soon for another carefully added title.</p></div><Link href="/library" className="focus-ring inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-amethyst">Browse library <ArrowRight size={14} /></Link></div>;
}

export function HomePersistentPage() {
  const library = trpc.library.list.useQuery();
  const categories = trpc.library.categories.useQuery();
  const items = (library.data ?? []).map(toViewBook);
  const [featured, ...recent] = items;

  return <PageFrame><main>
    <section className="relative min-h-[620px] overflow-hidden border-b hairline sm:min-h-[650px]"><img src={assets.hero} alt="A quiet reading room" className="absolute inset-0 size-full object-cover opacity-70" fetchPriority="high" /><div className="hero-vignette absolute inset-0" /><div className="relative container flex min-h-[620px] items-end py-14 sm:min-h-[650px] sm:items-center sm:py-24"><div className="max-w-[680px]"><p className="eyebrow text-amethyst">A digital library for curious minds</p><h1 className="font-display mt-6 text-[clamp(3.3rem,9vw,7.8rem)] leading-[.91] tracking-[-.04em]">Read.<br /><span className="text-[#b7a4d7]">Discover.</span><br />Grow.</h1><p className="mt-6 max-w-md text-sm leading-7 text-[#d0c8d2] sm:mt-8 sm:text-base sm:leading-8">A calm place to read. Find the next page worth your time, and let the rest of the world go quiet for a while.</p><div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-4 sm:mt-10"><Link href="/library" className="focus-ring inline-flex min-h-11 items-center gap-3 bg-[#b7a4d7] px-5 py-3 text-xs font-bold uppercase tracking-[.15em] text-[#17121c]">Explore library <ArrowRight size={15} /></Link><Link href="/categories" className="focus-ring inline-flex min-h-11 items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#e2dce5] hover:text-amethyst">Browse categories <ChevronRight size={15} /></Link></div><div className="mt-10 sm:mt-16"><SearchBar /></div></div></div></section>

    <section className="container py-16 sm:py-24 lg:py-32"><SectionLabel number="01">Featured book</SectionLabel>{featured ? <div className="grid gap-10 lg:grid-cols-[minmax(0,.9fr)_1.25fr] lg:items-center lg:gap-24"><Link href={`/book/${featured.slug}`} className="focus-ring group relative mx-auto block w-full max-w-[360px] lg:max-w-none"><div className="cover-frame aspect-[2/3] overflow-hidden cover-shadow"><div className="size-full overflow-hidden bg-[#25212b]"><img src={featured.cover} alt={`${featured.title} cover`} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" /></div></div></Link><div className="max-w-[600px]"><p className="eyebrow text-[#8f8996]">Editor’s shelf · {featured.pages} pages</p><h2 className="font-display mt-5 text-[clamp(2.8rem,5vw,5.4rem)] leading-[.95]">{featured.title}</h2><p className="mt-5 text-sm leading-8 text-[#b6aeba] sm:mt-6">{featured.description}</p><div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#8f8996]"><span>{featured.author}</span><span className="hidden h-1 w-1 rounded-full bg-[#b7a4d7] sm:block" /><span>{featured.category}</span></div><Link href={`/read/${featured.slug}`} className="focus-ring mt-8 inline-flex min-h-11 items-center gap-3 border-b border-[#b7a4d7] pb-2 text-xs font-bold uppercase tracking-[.17em] sm:mt-10">Read now <ArrowRight size={15} /></Link></div></div> : <QueryNotice loading={library.isLoading} error={library.error} empty="Your library is waiting for its first chapter." onRetry={() => void library.refetch()} />}</section>

    <section className="border-y hairline bg-[#151219] py-16 sm:py-24"><div className="container"><SectionLabel number="02">Recently added</SectionLabel>{recent.length ? <BookGrid items={recent.slice(0, 4)} /> : library.isLoading ? <QueryNotice loading error={null} empty="" /> : <EditorialEmptyShelf />}</div></section>

    <section className="container py-16 sm:py-24 lg:py-32"><div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-24"><div><SectionLabel number="03">Find your shelf</SectionLabel><h2 className="font-display text-[clamp(2.6rem,4vw,4.4rem)] leading-[.97]">Read by<br /><span className="text-amethyst">curiosity.</span></h2><p className="mt-5 max-w-sm text-sm leading-7 text-[#8f8996]">Start with the question you have today. Every shelf leads somewhere a little different.</p></div><div className="grid grid-cols-1 border-t hairline sm:grid-cols-2 lg:grid-cols-3">{(categories.data ?? []).slice(0, 9).map((category, index) => <Link href={`/search?q=${encodeURIComponent(category.name)}`} key={category.id} className="focus-ring group flex min-h-[76px] items-center justify-between border-b hairline pr-3 text-sm text-[#c9c1ce] hover:text-amethyst sm:min-h-[88px]"><span>{category.name}</span><span className="text-[.65rem] text-[#716a79]">{String(index + 1).padStart(2, "0")}</span></Link>)}{!categories.isLoading && !categories.data?.length && <p className="col-span-full py-8 text-sm text-[#8f8996]">Categories will appear as books are added.</p>}</div></div></section>
  </main></PageFrame>;
}

export function LibraryPersistentPage() {
  const [categorySlug, setCategorySlug] = useState<string>();
  const categories = trpc.library.categories.useQuery();
  const library = trpc.library.list.useQuery(categorySlug ? { categorySlug } : undefined);
  const items = (library.data ?? []).map(toViewBook);

  return <PageFrame><main className="container py-12 sm:py-16 lg:py-24"><div className="flex flex-col justify-between gap-8 border-b hairline pb-10 sm:gap-10 sm:pb-12 lg:flex-row lg:items-end"><div><p className="eyebrow text-amethyst">The library / 01</p><h1 className="font-display mt-5 text-[clamp(3.3rem,8vw,7rem)] leading-[.92]">Every book,<br /><span className="text-[#81788c]">a doorway.</span></h1></div><p className="max-w-sm text-sm leading-7 text-[#a39aa9]">A growing shelf of books selected for their ability to make a little more room in your day.</p></div>
    <div className="scrollbar-hidden -mx-5 overflow-x-auto px-5 py-6 sm:mx-0 sm:px-0 sm:py-8"><div className="flex min-w-max items-center gap-2.5 sm:flex-wrap sm:gap-3"><Filter size={16} className="mr-1 text-amethyst" /><button onClick={() => setCategorySlug(undefined)} aria-pressed={!categorySlug} className={`focus-ring min-h-10 px-3 py-2 text-xs font-semibold ${!categorySlug ? "bg-[#b7a4d7] text-[#17121c]" : "text-[#aaa1b0] hover:text-[#f3eee6]"}`}>All books</button>{(categories.data ?? []).map((category) => <button key={category.id} onClick={() => setCategorySlug(category.slug)} aria-pressed={categorySlug === category.slug} className={`focus-ring min-h-10 px-3 py-2 text-xs font-semibold ${categorySlug === category.slug ? "bg-[#b7a4d7] text-[#17121c]" : "text-[#aaa1b0] hover:text-[#f3eee6]"}`}>{category.name}</button>)}</div></div>
    <div className="mb-8 flex items-center justify-between border-t hairline pt-5"><span className="text-xs text-[#a39aa9]">{items.length} {items.length === 1 ? "book" : "books"} in the collection</span><Link href="/search" className="focus-ring flex min-h-10 items-center gap-2 text-xs font-semibold text-[#b7a4d7]">Search the library <Search size={14} /></Link></div>{items.length ? <BookGrid items={items} /> : <QueryNotice loading={library.isLoading} error={library.error} empty={categorySlug ? "No books on this shelf yet." : "Your library is waiting for its first chapter."} onRetry={() => void library.refetch()} />}
  </main></PageFrame>;
}

export function CategoriesPersistentPage() {
  const categories = trpc.library.categories.useQuery();
  return <PageFrame><main className="container py-12 sm:py-16 lg:py-24"><div className="max-w-3xl"><p className="eyebrow text-amethyst">The library / 02</p><h1 className="font-display mt-5 text-[clamp(3.4rem,8vw,7.3rem)] leading-[.91]">Follow a<br /><span className="text-[#81788c]">thread.</span></h1><p className="mt-6 max-w-lg text-base leading-8 text-[#b4acba] sm:mt-8">Some days begin with a story. Some with a question. Choose a direction and see where it takes you.</p></div><div className="mt-14 grid border-t hairline sm:mt-20 sm:grid-cols-2 lg:grid-cols-3">{(categories.data ?? []).map((category, index) => <Link key={category.id} href={`/search?q=${encodeURIComponent(category.name)}`} className="focus-ring group min-h-[132px] border-b hairline p-6 hover:bg-[#19151e] sm:min-h-[150px] sm:p-7"><div className="flex items-start justify-between"><Mark small /><span className="text-[.65rem] text-[#6f6876]">{String(index + 1).padStart(2, "0")}</span></div><div className="mt-8 flex items-end justify-between sm:mt-9"><h2 className="font-display text-[1.65rem] group-hover:text-amethyst">{category.name}</h2><ChevronRight size={17} className="text-[#6f6876]" /></div></Link>)}</div>{!categories.isLoading && !categories.data?.length && <div className="mt-8"><QueryNotice loading={false} error={categories.error} empty="The first category is still waiting." onRetry={() => void categories.refetch()} /></div>}</main></PageFrame>;
}

export function SearchPersistentPage() {
  const initial = new URLSearchParams(window.location.search).get("q") ?? "";
  const library = trpc.library.list.useQuery(initial ? { query: initial } : undefined);
  const items = (library.data ?? []).map(toViewBook);
  return <PageFrame><main className="container min-h-[620px] py-12 sm:min-h-[720px] sm:py-16 lg:py-24"><div className="max-w-3xl"><p className="eyebrow text-amethyst">Search the shelves</p><h1 className="font-display mt-5 text-[clamp(3.3rem,8vw,7rem)] leading-[.92]">What are you<br /><span className="text-[#81788c]">looking for?</span></h1><div className="mt-8 sm:mt-10"><SearchBar compact defaultValue={initial} /></div></div><div className="mt-14 border-t hairline pt-6 sm:mt-20"><div className="mb-8 flex items-center justify-between gap-4"><span className="text-xs text-[#a39aa9]">{initial ? `${items.length} results for “${initial}”` : "Showing all books"}</span>{initial && <Link href="/search" className="focus-ring text-xs font-semibold text-[#b7a4d7]">Clear search</Link>}</div>{items.length ? <BookGrid items={items} /> : <QueryNotice loading={library.isLoading} error={library.error} empty="No books found." onRetry={() => void library.refetch()} />}</div></main></PageFrame>;
}

export function BookPersistentPage() {
  const [, params] = useRoute("/book/:slug");
  const slug = params?.slug;
  const detail = trpc.library.getBySlug.useQuery({ slug: slug ?? "route-pending" }, { enabled: Boolean(slug) });
  const { isAuthenticated } = useAuth();
  const book = detail.data as RecordBook | undefined;
  const favorite = trpc.reader.toggleFavorite.useMutation({ onSuccess: (result) => toast.success(result.favorite ? "Added to your reading list." : "Removed from your reading list."), onError: () => toast.error("Please sign in to save books to your reading list.") });

  if (!slug || detail.isLoading) return <PageFrame><main className="container py-20 sm:py-24"><QueryNotice loading error={null} empty="" /></main></PageFrame>;
  if (!book) return <PageFrame><main className="container py-20 sm:py-24"><QueryNotice loading={false} error={detail.error} empty="This book is not available." onRetry={() => void detail.refetch()} /></main></PageFrame>;

  const view = toViewBook(book);
  return <PageFrame><main className="container py-10 sm:py-14 lg:py-24"><Link href="/library" className="focus-ring inline-flex min-h-10 items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-[#a39aa9] hover:text-[#f3eee6]"><ArrowLeft size={15} /> Back to library</Link><div className="mt-8 grid gap-10 sm:mt-12 lg:grid-cols-[minmax(260px,420px)_1fr] lg:items-center lg:gap-24"><div className="mx-auto w-full max-w-[390px]"><div className="cover-frame aspect-[2/3] overflow-hidden cover-shadow"><div className="size-full overflow-hidden bg-[#24202a]"><img src={view.cover} alt={`${view.title} cover`} className="h-full w-full object-cover" /></div></div></div><div className="max-w-2xl"><p className="eyebrow text-amethyst">{view.category} · {view.pages} pages</p><h1 className="font-display mt-5 text-[clamp(3rem,7vw,6.7rem)] leading-[.92]">{view.title}</h1><p className="mt-5 text-lg text-[#c1b9c6] sm:mt-6">{view.author}</p><div className="my-7 h-px w-full bg-[#332d39] sm:my-8" /><p className="max-w-xl text-base leading-8 text-[#c0b7c4]">{view.description}</p><div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 sm:mt-10"><Link href={`/read/${view.slug}`} className="focus-ring inline-flex min-h-11 items-center gap-3 bg-[#b7a4d7] px-5 py-3 text-xs font-bold uppercase tracking-[.15em] text-[#17121c]">Read now <ArrowRight size={15} /></Link><button onClick={() => favorite.mutate({ bookId: book.id })} disabled={favorite.isPending} className="focus-ring inline-flex min-h-11 items-center gap-2 text-xs font-bold uppercase tracking-[.13em] text-[#d1c8d5] hover:text-amethyst disabled:opacity-50"><Heart size={15} /> {favorite.isPending ? "Saving…" : isAuthenticated ? "Save to reading list" : "Sign in to save"}</button></div></div></div></main></PageFrame>;
}

function ReaderToolbar({ page, pages, zoom, theme, onPage, onZoom, onTheme, onBookmark }: { page: number; pages: number; zoom: number; theme: ReaderTheme; onPage: (page: number) => void; onZoom: (zoom: number) => void; onTheme: (theme: ReaderTheme) => void; onBookmark: () => void }) {
  return <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#3d3547] bg-[#17141c]/95 px-3 py-3 backdrop-blur-xl md:bottom-5 md:left-1/2 md:right-auto md:w-auto md:-translate-x-1/2 md:rounded-sm md:border"><div className="flex items-center justify-center gap-1 text-[#d7cedb]"><button className="focus-ring p-2 disabled:opacity-30" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}><ArrowLeft size={16} /></button><span className="mx-2 border-x border-[#3a3242] px-3 text-xs">{page} <span className="text-[#746c7d]">/ {pages}</span></span><button className="focus-ring p-2 disabled:opacity-30" onClick={() => onPage(Math.min(pages, page + 1))} disabled={page === pages}><ArrowRight size={16} /></button><button className="focus-ring hidden p-2 sm:block" onClick={() => onZoom(Math.max(.8, zoom - .1))}><Minus size={16} /></button><button className="focus-ring hidden p-2 sm:block" onClick={() => onZoom(Math.min(1.35, zoom + .1))}><Plus size={16} /></button><button className="focus-ring p-2" onClick={() => onTheme(theme === "dark" ? "daylight" : theme === "daylight" ? "sepia" : "dark")}><Sparkles size={16} /></button><button className="focus-ring hidden p-2 sm:block" onClick={() => document.documentElement.requestFullscreen?.()}><Expand size={16} /></button><button className="focus-ring hidden p-2 text-amethyst sm:block" onClick={onBookmark}><Bookmark size={16} /></button></div></div>;
}

export function ReaderPersistentPage() {
  const [, params] = useRoute("/read/:slug");
  const slug = params?.slug;
  const detail = trpc.library.getBySlug.useQuery({ slug: slug ?? "route-pending" }, { enabled: Boolean(slug) });
  const { isAuthenticated } = useAuth();
  const saveProgress = trpc.reader.saveProgress.useMutation();
  const saveBookmark = trpc.reader.addBookmark.useMutation({ onSuccess: () => toast.success("Bookmark saved."), onError: () => toast.error("Please sign in to save bookmarks.") });
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pdfPages, setPdfPages] = useState(0);
  const [theme, setTheme] = useState<ReaderTheme>(loadReaderTheme);
  const book = detail.data as RecordBook | undefined;
  const pdfUrl = book?.pdfKey ? readerPdfUrl(book.slug) : null;

  useEffect(() => { persistReaderTheme(theme); }, [theme]);
  useEffect(() => { setPdfPages(0); setPage(1); }, [book?.id, book?.pdfKey]);
  const pages = pdfPages || Math.max(1, book?.pageCount ?? 1);
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);
  useEffect(() => { if (book && isAuthenticated) saveProgress.mutate({ bookId: book.id, currentPage: page, progressPercentage: Math.round((page / pages) * 100) }); }, [book?.id, isAuthenticated, page, pages]);

  if (!slug || !book) return <PageFrame><main className="container py-24"><QueryNotice loading={detail.isLoading} error={detail.error} empty="This reading room is not available." onRetry={() => void detail.refetch()} /></main></PageFrame>;
  const themeClass = theme === "sepia" ? "bg-[#3b3026]" : theme === "daylight" ? "bg-[#d9d0bd]" : "bg-[#111015]";
  const paperClass = theme === "sepia" ? "bg-[#e1cfaa] text-[#483d32]" : theme === "daylight" ? "bg-[#eee8da] text-[#413c38]" : "bg-[#211e25] text-[#d9d2d8]";

  return <div className={`min-h-screen ${themeClass}`}><header className="flex h-[66px] items-center justify-between border-b border-white/10 bg-[#111015]/90 px-4 text-[#eee9f0] md:px-8"><Link href={`/book/${book.slug}`} className="focus-ring flex items-center gap-3 text-xs font-semibold"><ArrowLeft size={16} /><span className="hidden sm:inline">Back to book</span></Link><div className="flex items-center gap-3"><Mark small /><span className="font-display text-lg tracking-[.14em]">ODHYAY</span></div><span className="text-xs text-[#938b9c]">{theme === "dark" ? "Night" : theme === "daylight" ? "Daylight" : "Sepia"}</span></header><main className="flex min-h-[calc(100vh-66px)] flex-col items-center px-4 pb-28 pt-10 md:pt-16"><div className="mb-7 flex w-full max-w-[760px] justify-between text-[.62rem] font-bold uppercase tracking-[.16em] text-white/45"><span>Reading · {book.categoryName ?? "Other"}</span><span>{Math.round((page / pages) * 100)}% complete</span></div><article className={`reader-paper w-full max-w-[760px] ${pdfUrl ? "overflow-hidden" : "px-7 py-12 sm:px-14 sm:py-16 lg:px-24 lg:py-24"} ${paperClass}`} style={pdfUrl ? undefined : { transform: `scale(${zoom})`, transformOrigin: "top center", marginBottom: `${(zoom - 1) * 850}px` }}>{pdfUrl ? <PdfDocument url={pdfUrl} pageNumber={page} zoom={zoom} onPageCount={setPdfPages} /> : <><p className="text-[.63rem] font-bold uppercase tracking-[.2em] opacity-60">{book.categoryName ?? "Other"} · Chapter {String(page).padStart(2, "0")}</p><h1 className="font-display mt-8 text-4xl leading-tight sm:text-5xl">{book.title}</h1><p className="mt-4 text-sm opacity-65">{book.authorName}</p><div className="my-12 border-t border-current/15" /><p className="font-display text-[1.14rem] leading-[2] sm:text-[1.3rem]">{book.description}</p><p className="mt-10 font-display text-[1.14rem] leading-[2] sm:text-[1.3rem]">A stored PDF will appear here once an administrator uploads one for this book. Reading progress and bookmarks remain linked to the page controls below.</p><div className="mt-24 flex justify-between border-t border-current/15 pt-5 text-[.63rem] font-bold uppercase tracking-[.16em] opacity-55"><span>ODHYAY</span><span>Page {page}</span></div></>}</article></main><ReaderToolbar page={page} pages={pages} zoom={zoom} theme={theme} onPage={setPage} onZoom={setZoom} onTheme={setTheme} onBookmark={() => saveBookmark.mutate({ bookId: book.id, pageNumber: page })} /></div>;
}
