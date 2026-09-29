/* ODHYAY — Quiet Editorial pages. Calm typography, real covers, generous whitespace. No stock library imagery. */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, ArrowRight, Bookmark, BookOpen, ChevronRight, Expand, Heart, Minus, Plus, RefreshCw, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { PdfDocument } from "@/components/PdfDocument";
import { readerPdfUrl } from "@/lib/pdfReader";
import { loadReaderTheme, persistReaderTheme, type ReaderTheme } from "@/lib/readerTheme";
import { BookGrid, CategoryFilter, Mark, PageFrame, ReadingProgress, SearchBar, SectionHeading, SectionLabel } from "@/components/OdhyayShell";
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

type LastRead = { slug: string; title: string; author: string; cover: string; page: number; pages: number; progress: number };
const LAST_READ_KEY = "odhyay-last-read";
function readLastRead(): LastRead | null {
  try {
    const raw = window.localStorage.getItem(LAST_READ_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastRead;
    if (!parsed?.slug) return null;
    return parsed;
  } catch { return null; }
}
function writeLastRead(value: LastRead) {
  try { window.localStorage.setItem(LAST_READ_KEY, JSON.stringify(value)); } catch { /* quiet */ }
}

function QueryNotice({ loading, error, empty, onRetry }: { loading: boolean; error: unknown; empty: string; onRetry?: () => void }) {
  if (loading) {
    return <div role="status" className="loading-shimmer border hairline od-surface px-6 py-12 sm:px-8"><div className="h-3 w-28 od-surface-raised/10" /><div className="mt-6 h-8 max-w-sm od-surface-raised/10" /><div className="mt-3 h-4 max-w-lg od-surface-raised/10" /><p className="mt-8 text-sm od-muted">Preparing the shelves…</p></div>;
  }
  if (error) {
    return <div role="alert" className="border od-border-strong od-surface px-6 py-10 sm:px-8"><p className="font-display text-2xl od-ink">The library needs a moment.</p><p className="mt-3 max-w-lg text-sm leading-7 od-muted">We could not reach the shelf just now. Your place is safe; please try again.</p>{onRetry && <button onClick={onRetry} className="focus-ring od-button od-button-outline mt-6"><RefreshCw size={14} /> Try again</button>}</div>;
  }
  return <div className="border border-dashed od-surface/40 px-6 py-14 text-center sm:px-10" style={{ borderColor: "var(--od-border)" }}><Mark /><h2 className="font-display mt-5 text-3xl">{empty}</h2><p className="mx-auto mt-3 max-w-md text-sm leading-7 od-muted">Your first published book will appear here, ready for a reader to find.</p></div>;
}

function EditorialEmptyShelf() {
  return <div className="grid gap-5 border-y py-10 sm:grid-cols-[auto_1fr_auto] sm:items-center" style={{ borderColor: "var(--od-border)" }}><div className="flex size-12 items-center justify-center border od-surface" style={{ borderColor: "var(--od-border)" }}><BookOpen size={18} className="od-accent" /></div><div><p className="font-display text-2xl">The next chapter is being chosen.</p><p className="mt-2 max-w-xl text-sm leading-7 od-muted">This shelf is deliberately quiet for now. Explore the full library, or return soon for another carefully added title.</p></div><Link href="/library" className="focus-ring inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] od-accent">Browse library <ArrowRight size={14} /></Link></div>;
}

function ElegantEmptySearch({ onClear }: { onClear?: () => void }) {
  return <div className="border border-dashed px-6 py-16 text-center sm:px-10 sm:py-20" style={{ borderColor: "var(--od-border)" }}><Mark /><h2 className="font-display mt-5 text-[2rem] leading-tight">No books found.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-7 od-muted">Try another title, author, or category — or wander the full library instead.</p><div className="mt-8 flex flex-wrap items-center justify-center gap-3">{onClear ? <button onClick={onClear} className="focus-ring od-button od-button-outline">Clear search</button> : null}<Link href="/library" className="focus-ring od-button od-button-primary">Return to the library <ArrowRight size={14} /></Link></div></div>;
}

function ContinueReading({ books }: { books: Book[] }) {
  const { isAuthenticated } = useAuth();
  const [last, setLast] = useState<LastRead | null>(null);
  useEffect(() => { setLast(readLastRead()); }, []);
  if (!isAuthenticated || !last) return null;
  const match = books.find((b) => b.slug === last.slug);
  if (!match && books.length > 0) {
    // If the saved book is no longer published, stay quiet.
    const stillThere = books.some((b) => b.slug === last.slug);
    if (!stillThere && books.length) return null;
  }
  const cover = match?.cover ?? last.cover;
  const title = match?.title ?? last.title;
  const author = match?.author ?? last.author;
  return (
    <section className="container pt-16 sm:pt-24" aria-label="Continue reading">
      <SectionLabel number="02">Continue reading</SectionLabel>
      <div className="mx-auto grid max-w-4xl gap-6 border p-6 sm:p-8 lg:grid-cols-[120px_1fr_auto] lg:items-center lg:gap-8" style={{ borderColor: "var(--od-border)", background: "var(--od-surface-raised)" }}>
        <Link href={`/book/${last.slug}`} className="focus-ring mx-auto block w-[120px] shrink-0 sm:mx-0" aria-label={`Open ${title}`}>
          <div className="aspect-[2/3] overflow-hidden cover-shadow"><img src={cover} alt={`${title} cover`} className="h-full w-full object-cover" loading="lazy" /></div>
        </Link>
        <div className="min-w-0 text-center sm:text-left lg:text-left">
          <p className="text-xs font-semibold tracking-wide od-subtle">The book you started is waiting</p>
          <h2 className="font-display mt-1.5 text-2xl font-medium leading-tight sm:text-[1.7rem]">{title}</h2>
          <p className="mt-1 text-sm od-muted">{author}</p>
          <div className="mx-auto mt-4 max-w-md sm:mx-0"><ReadingProgress value={last.progress} /><p className="mt-2 text-xs od-muted tabular-nums">{last.progress}% · Page {last.page}{last.pages ? ` of ${last.pages}` : ""}</p></div>
        </div>
        <Link href={`/read/${last.slug}`} className="focus-ring od-button od-button-primary w-full shrink-0 lg:w-auto">Continue reading <ArrowRight size={15} /></Link>
      </div>
    </section>
  );
}

function HeroCovers({ items }: { items: Book[] }) {
  const covers = items.slice(0, 5);
  if (!covers.length) return null;
  const [main, ...rest] = covers;
  const side = rest.slice(0, 2);
  const small = rest.slice(2, 4);
  return (
    <div className="od-hero-shelf" aria-hidden="true">
      {small[0] ? <div className="od-hero-book od-hero-book-small hidden sm:block" style={{ transform: "translateY(14px)" }}><img src={small[0].cover} alt="" loading="lazy" decoding="async" /></div> : null}
      {side[0] ? <div className="od-hero-book od-hero-book-side hidden sm:block" style={{ transform: "translateY(6px)" }}><img src={side[0].cover} alt="" loading="lazy" decoding="async" /></div> : null}
      <Link href={`/book/${main.slug}`} className="focus-ring od-hero-book od-hero-book-main" aria-label={`Open ${main.title}`} tabIndex={-1}>
        <img src={main.cover} alt={`${main.title} cover`} fetchPriority="high" decoding="async" />
      </Link>
      {side[1] ? <div className="od-hero-book od-hero-book-side hidden sm:block" style={{ transform: "translateY(6px)" }}><img src={side[1].cover} alt="" loading="lazy" decoding="async" /></div> : null}
      {small[1] ? <div className="od-hero-book od-hero-book-small hidden md:block" style={{ transform: "translateY(14px)" }}><img src={small[1].cover} alt="" loading="lazy" decoding="async" /></div> : null}
      {/* Mobile: two supporting covers */}
      <div className="flex gap-3 sm:hidden">
        {rest.slice(0, 2).map((b) => <div key={b.slug} className="od-hero-book" style={{ width: 104, aspectRatio: "2/3" }}><img src={b.cover} alt="" loading="lazy" /></div>)}
      </div>
    </div>
  );
}

export function HomePersistentPage() {
  const library = trpc.library.list.useQuery();
  const categories = trpc.library.categories.useQuery();
  const items = (library.data ?? []).map(toViewBook);
  const [homeCategory, setHomeCategory] = useState<string | undefined>(undefined);
  const [featured, ...recent] = items;
  const filtered = useMemo(() => homeCategory ? items.filter((b) => b.category === homeCategory) : items.slice(0, 8), [items, homeCategory]);
  const categoryNames = useMemo(() => Array.from(new Set(items.map((b) => b.category))).slice(0, 8), [items]);
  const heroItems = items.length ? items : [];

  return <PageFrame><main>
    {/* HERO — calm editorial, real covers only */}
    <section className="od-hero border-b hairline">
      <div className="container grid gap-12 py-14 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-16 lg:py-24">
        <div className="max-w-[620px]">
          <p className="eyebrow od-hero-accent">ODHYAY · A digital library for curious minds</p>
          <h1 className="font-display mt-6 text-[clamp(3rem,8vw,6.4rem)] leading-[.95] tracking-[-.03em]">Read with<br /><span className="italic">intention.</span></h1>
          <p className="od-hero-copy mt-6 max-w-md text-[15px] leading-8 sm:text-base">Discover books worth your time,<br />and build a habit worth keeping.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-10">
            <Link href="/library" className="focus-ring od-button od-button-primary">Explore Library <ArrowRight size={15} /></Link>
            <Link href="/about" className="focus-ring od-button od-button-outline">About ODHYAY</Link>
          </div>
          <div className="od-hero-rule mt-10 max-w-md" />
          <p className="mt-5 text-xs leading-6 od-hero-copy">Quiet pages · Thoughtful curation · Bengali & English shelves</p>
        </div>
        <div className="min-w-0">
          {heroItems.length ? <HeroCovers items={heroItems} /> : library.isLoading ? <div role="status" className="loading-shimmer aspect-[4/3] w-full border" style={{ borderColor: "var(--od-border)" }}><span className="sr-only">Loading covers…</span></div> : <EditorialEmptyShelf />}
          {heroItems.length > 1 ? <p className="mt-6 text-xs od-hero-copy">From the current shelves — {heroItems.slice(0, 3).map((b) => b.title).join(" · ")}</p> : null}
        </div>
      </div>
    </section>

    <ContinueReading books={items} />

    {/* FEATURED */}
    <section className="container od-section" aria-label="Featured books">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6 sm:mb-12">
        <SectionHeading className="max-w-2xl" eyebrow="Featured" title={<>Books worth <span className="italic od-accent">your time.</span></>} description="A small, deliberate selection — chosen for clarity, depth, and the feeling that stays after the last page." />
        <Link href="/library" className="focus-ring inline-flex min-h-10 items-center gap-2 text-xs font-bold uppercase tracking-[.16em] od-accent">View all <ArrowRight size={14} /></Link>
      </div>
      {items.length ? <BookGrid items={items.slice(0, 4)} /> : <QueryNotice loading={library.isLoading} error={library.error} empty="Your library is waiting for its first chapter." onRetry={() => void library.refetch()} />}
    </section>

    {/* CATEGORY EXPLORATION — elegant pills */}
    <section className="border-y hairline" style={{ background: "var(--od-surface-raised)" }} aria-label="Explore by category">
      <div className="container od-section">
        <SectionHeading eyebrow="Explore by category" title="Follow what pulls you." description="No giant cards. Just quiet directions — pick a thread and see where it leads." />
        <CategoryFilter options={[{ name: "All" }, ...categoryNames.map((n) => ({ name: n, slug: n }))]} value={homeCategory} onChange={(slug) => setHomeCategory(slug)} />
        <div className="mt-10">
          {filtered.length ? <BookGrid items={filtered.slice(0, 4)} /> : <p className="py-6 text-sm od-muted">{homeCategory ? `No books on the “${homeCategory}” shelf yet.` : "Books will appear here once published."}</p>}
        </div>
      </div>
    </section>

    {/* WHY ODHYAY */}
    <section className="container od-section" aria-label="Why Odhyay">
      <p className="eyebrow od-accent">Why ODHYAY</p>
      <h2 className="font-display mt-4 max-w-3xl text-[clamp(2.2rem,5vw,4rem)] leading-[1.02]">Reading should feel <span className="italic">quiet</span> again.</h2>
      <div className="mt-12 grid gap-10 border-t pt-10 sm:grid-cols-3 sm:gap-8" style={{ borderColor: "var(--od-border)" }}>
        {[["01", "Curated", "Books worth your attention."], ["02", "Focused", "No distractions. Just reading."], ["03", "Accessible", "Your library, wherever you go."]].map(([n, t, d]) => (
          <div key={n}><p className="text-xs font-bold tracking-[.18em] od-subtle">{n}</p><h3 className="font-display mt-4 text-[1.7rem]">{t}</h3><p className="mt-2 text-sm leading-7 od-muted">{d}</p></div>
        ))}
      </div>
    </section>

    {/* NEW TO ODHYAY */}
    <section className="border-t hairline" aria-label="New to Odhyay">
      <div className="container od-section">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 sm:mb-12">
          <SectionHeading className="max-w-2xl" eyebrow="New to ODHYAY" title="Recently added." description="Fresh arrivals on the shelf." />
          <Link href="/library" className="focus-ring inline-flex min-h-10 items-center gap-2 text-xs font-bold uppercase tracking-[.16em] od-accent">View all <ArrowRight size={14} /></Link>
        </div>
        {recent.length ? <BookGrid items={recent.slice(0, 4)} /> : library.isLoading ? <QueryNotice loading error={null} empty="" /> : <EditorialEmptyShelf />}
      </div>
    </section>

    {/* EDITORIAL QUOTE */}
    <section className="border-t hairline" aria-label="Editorial note">
      <div className="container py-16 text-center sm:py-24">
        <Mark />
        <blockquote className="od-quote mx-auto mt-8 max-w-3xl text-[clamp(1.8rem,4.5vw,3.2rem)]">“A good book doesn’t ask<br />for your attention.<br /><span className="italic od-accent">It earns it.”</span></blockquote>
        <p className="mt-8 text-xs tracking-[.2em] uppercase od-subtle">ODHYAY · Reading room note</p>
      </div>
    </section>
  </main></PageFrame>;
}

export function LibraryPersistentPage() {
  const [categorySlug, setCategorySlug] = useState<string>();
  const categories = trpc.library.categories.useQuery();
  const library = trpc.library.list.useQuery(categorySlug ? { categorySlug } : undefined);
  const items = (library.data ?? []).map(toViewBook);

  return <PageFrame><main className="container py-12 sm:py-16 lg:py-24"><div className="flex flex-col justify-between gap-8 border-b pb-10 sm:gap-10 sm:pb-12 lg:flex-row lg:items-end" style={{ borderColor: "var(--od-border)" }}><div><p className="eyebrow od-accent">The library / 01</p><h1 className="font-display mt-5 text-[clamp(2.8rem,7vw,5.5rem)] leading-[.95]">Every book,<br /><span className="od-subtle">a doorway.</span></h1></div><p className="max-w-sm text-sm leading-7 od-muted">A growing shelf of books selected for their ability to make a little more room in your day.</p></div>
    <div className="py-6 sm:py-8"><CategoryFilter options={[{ name: "All books" }, ...((categories.data ?? []).map((c) => ({ name: c.name, slug: c.slug })) )]} value={categorySlug} onChange={setCategorySlug} /></div>
    <div className="mb-8 flex items-center justify-between border-t pt-5" style={{ borderColor: "var(--od-border)" }}><span className="text-xs od-muted tabular-nums">{items.length} {items.length === 1 ? "book" : "books"} in the collection</span><Link href="/search" className="focus-ring flex min-h-10 items-center gap-2 text-xs font-semibold od-accent">Search the library <Search size={14} /></Link></div>{items.length ? <BookGrid items={items} /> : <QueryNotice loading={library.isLoading} error={library.error} empty={categorySlug ? "No books on this shelf yet." : "Your library is waiting for its first chapter."} onRetry={() => void library.refetch()} />}
  </main></PageFrame>;
}

export function CategoriesPersistentPage() {
  const categories = trpc.library.categories.useQuery();
  return <PageFrame><main className="container py-12 sm:py-16 lg:py-24"><div className="max-w-3xl"><p className="eyebrow od-accent">The library / 02</p><h1 className="font-display mt-5 text-[clamp(2.8rem,7vw,5.8rem)] leading-[.93]">Follow a<br /><span className="od-subtle">thread.</span></h1><p className="mt-6 max-w-lg text-[15px] leading-8 od-muted sm:mt-8">Some days begin with a story. Some with a question. Choose a direction and see where it takes you.</p></div><div className="mt-14 grid border-t sm:mt-16 sm:grid-cols-2 lg:grid-cols-3" style={{ borderColor: "var(--od-border)" }}>{(categories.data ?? []).map((category, index) => <Link key={category.id} href={`/search?q=${encodeURIComponent(category.name)}`} className="focus-ring group min-h-[132px] border-b p-6 od-hover-surface sm:min-h-[150px] sm:p-7" style={{ borderColor: "var(--od-border)" }}><div className="flex items-start justify-between"><Mark small /><span className="text-[.65rem] od-subtle tabular-nums">{String(index + 1).padStart(2, "0")}</span></div><div className="mt-8 flex items-end justify-between sm:mt-9"><h2 className="font-display text-[1.6rem] group-hover:od-accent">{category.name}</h2><ChevronRight size={17} className="od-subtle" /></div></Link>)}</div>{!categories.isLoading && !categories.data?.length && <div className="mt-8"><QueryNotice loading={false} error={categories.error} empty="The first category is still waiting." onRetry={() => void categories.refetch()} /></div>}</main></PageFrame>;
}

export function SearchPersistentPage() {
  const initial = new URLSearchParams(window.location.search).get("q") ?? "";
  const library = trpc.library.list.useQuery(initial ? { query: initial } : undefined);
  const items = (library.data ?? []).map(toViewBook);
  return <PageFrame><main className="container min-h-[620px] py-12 sm:min-h-[720px] sm:py-16 lg:py-24"><div className="max-w-3xl"><p className="eyebrow od-accent">Search the shelves</p><h1 className="font-display mt-5 text-[clamp(2.8rem,7vw,5.5rem)] leading-[.94]">What are you<br /><span className="od-subtle">looking for?</span></h1><div className="mt-8 sm:mt-10"><SearchBar compact defaultValue={initial} /></div></div><div className="mt-14 border-t pt-6 sm:mt-16" style={{ borderColor: "var(--od-border)" }}><div className="mb-8 flex items-center justify-between gap-4"><span className="text-xs od-muted">{initial ? `${items.length} result${items.length === 1 ? "" : "s"} for “${initial}”` : "Showing all books"}</span>{initial && <Link href="/search" className="focus-ring text-xs font-semibold od-accent">Clear search</Link>}</div>{library.isLoading ? <QueryNotice loading error={null} empty="" /> : library.error ? <QueryNotice loading={false} error={library.error} empty="Search is unavailable." onRetry={() => void library.refetch()} /> : items.length ? <BookGrid items={items} /> : <ElegantEmptySearch />}</div></main></PageFrame>;
}

export function BookPersistentPage() {
  const [, params] = useRoute("/book/:slug");
  const slug = params?.slug;
  const detail = trpc.library.getBySlug.useQuery({ slug: slug ?? "route-pending" }, { enabled: Boolean(slug) });
  const { isAuthenticated } = useAuth();
  const book = detail.data as RecordBook | undefined;
  const favorite = trpc.reader.toggleFavorite.useMutation({ onSuccess: (result) => toast.success(result.favorite ? "Added to your reading list." : "Removed from your reading list."), onError: () => toast.error("Please sign in to save books to your reading list.") });

  useEffect(() => {
    if (book) writeLastRead({ slug: book.slug, title: book.title, author: book.authorName, cover: book.coverUrl || fallbackCover, page: 1, pages: book.pageCount || 1, progress: 0 });
  }, [book?.slug]);

  if (!slug || detail.isLoading) return <PageFrame><main className="container py-20 sm:py-24"><QueryNotice loading error={null} empty="" /></main></PageFrame>;
  if (!book) return <PageFrame><main className="container py-20 sm:py-24"><QueryNotice loading={false} error={detail.error} empty="This book is not available." onRetry={() => void detail.refetch()} /></main></PageFrame>;

  const view = toViewBook(book);
  return <PageFrame><main className="container py-10 sm:py-14 lg:py-20"><Link href="/library" className="focus-ring od-button od-button-quiet"><ArrowLeft size={15} /> Back to Library</Link><div className="mt-8 grid gap-10 sm:mt-12 lg:grid-cols-[minmax(260px,400px)_1fr] lg:items-start lg:gap-20"><div className="premium-cover-stage mx-auto w-full max-w-[360px] lg:mx-0"><div className="cover-frame aspect-[2/3] overflow-hidden cover-shadow"><div className="size-full overflow-hidden" style={{ background: "var(--od-surface-muted)" }}><img src={view.cover} alt={`${view.title} cover`} className="h-full w-full object-cover" /></div></div></div><div className="max-w-2xl"><p className="eyebrow od-accent">{view.category}</p><h1 className="font-display mt-4 text-[clamp(2.4rem,6vw,4.8rem)] leading-[.98]">{view.title}</h1><p className="mt-4 text-lg od-muted">{view.author}</p><div className="my-7 h-px w-full sm:my-8" style={{ background: "var(--od-border)" }} /><p className="max-w-xl text-[15px] leading-8 od-muted">{view.description}</p><div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-10"><Link href={`/read/${view.slug}`} className="focus-ring od-button od-button-primary">Read Now <ArrowRight size={15} /></Link><button onClick={() => favorite.mutate({ bookId: book.id })} disabled={favorite.isPending} className="focus-ring od-button od-button-outline disabled:opacity-50"><Bookmark size={15} /> {favorite.isPending ? "Saving…" : isAuthenticated ? "Bookmark" : "Sign in to save"}</button></div><dl className="mt-10 grid max-w-md grid-cols-2 gap-x-8 gap-y-4 border-t pt-6 text-[13px]" style={{ borderColor: "var(--od-border)" }}><div><dt className="eyebrow od-subtle">Pages</dt><dd className="mt-1.5 od-ink tabular-nums">{view.pages}</dd></div><div><dt className="eyebrow od-subtle">Category</dt><dd className="mt-1.5 od-ink">{view.category}</dd></div><div><dt className="eyebrow od-subtle">Language</dt><dd className="mt-1.5 od-ink">Bengali / English</dd></div><div><dt className="eyebrow od-subtle">Format</dt><dd className="mt-1.5 od-ink">{book.pdfKey ? "PDF · Reader ready" : "Preview"}</dd></div></dl></div></div></main></PageFrame>;
}

function ReaderToolbar({ page, pages, zoom, theme, onPage, onZoom, onTheme, onBookmark }: { page: number; pages: number; zoom: number; theme: ReaderTheme; onPage: (page: number) => void; onZoom: (zoom: number) => void; onTheme: (theme: ReaderTheme) => void; onBookmark: () => void }) {
  return <div className="fixed bottom-0 left-0 right-0 z-40 border-t od-border bg-[var(--od-surface-muted)]/95 px-3 py-3 backdrop-blur-xl md:bottom-5 md:left-1/2 md:right-auto md:w-auto md:-translate-x-1/2 md:rounded-sm md:border"><div className="flex items-center justify-center gap-1 text-[var(--od-ink)]"><button className="focus-ring od-icon-button" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1} aria-label="Previous page"><ArrowLeft size={16} /></button><span className="mx-2 border-x od-border px-3 text-xs tabular-nums">{page} <span className="od-subtle">/ {pages}</span></span><button className="focus-ring od-icon-button" onClick={() => onPage(Math.min(pages, page + 1))} disabled={page === pages} aria-label="Next page"><ArrowRight size={16} /></button><button className="focus-ring od-icon-button hidden sm:grid" onClick={() => onZoom(Math.max(.8, zoom - .1))} aria-label="Decrease text size"><Minus size={16} /></button><button className="focus-ring od-icon-button hidden sm:grid" onClick={() => onZoom(Math.min(1.35, zoom + .1))} aria-label="Increase text size"><Plus size={16} /></button><button className="focus-ring od-icon-button" onClick={() => onTheme(theme === "dark" ? "daylight" : theme === "daylight" ? "sepia" : "dark")} aria-label="Change reading theme"><Sparkles size={16} /></button><button className="focus-ring od-icon-button hidden sm:grid" onClick={() => document.documentElement.requestFullscreen?.()} aria-label="Fullscreen"><Expand size={16} /></button><button className="focus-ring od-icon-button hidden sm:grid od-accent" onClick={onBookmark} aria-label="Save bookmark"><Bookmark size={16} /></button></div></div>;
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
  useEffect(() => {
    if (book && isAuthenticated) {
      saveProgress.mutate({ bookId: book.id, currentPage: page, progressPercentage: Math.round((page / pages) * 100) });
      writeLastRead({ slug: book.slug, title: book.title, author: book.authorName, cover: book.coverUrl || fallbackCover, page, pages, progress: Math.round((page / pages) * 100) });
    }
  }, [book?.id, isAuthenticated, page, pages]);

  if (!slug || !book) return <PageFrame><main className="container py-24"><QueryNotice loading={detail.isLoading} error={detail.error} empty="This reading room is not available." onRetry={() => void detail.refetch()} /></main></PageFrame>;
  const themeClass = theme === "sepia" ? "bg-[var(--od-surface-muted)]" : theme === "daylight" ? "bg-[var(--od-surface-raised)]" : "od-page";
  const paperClass = theme === "sepia" ? "bg-[var(--od-surface-raised)] text-[var(--od-ink)]" : theme === "daylight" ? "bg-[var(--od-surface-raised)] text-[var(--od-ink)]" : "bg-[var(--od-surface-muted)] text-[var(--od-ink)]";

  return <div className={`min-h-screen ${themeClass}`}><header className="flex h-[62px] items-center justify-between border-b od-surface-overlay px-4 text-[var(--od-ink)] md:px-8" style={{ borderColor: "var(--od-border)" }}><Link href={`/book/${book.slug}`} className="focus-ring flex items-center gap-2.5 text-xs font-bold uppercase tracking-[.1em]"><ArrowLeft size={16} /><span className="hidden sm:inline">Back</span></Link><div className="flex items-center gap-2.5"><Mark small /><span className="font-display text-[1.05rem] tracking-[.12em]">ODHYAY</span></div><div className="flex items-center gap-1"><button className="focus-ring od-icon-button" onClick={() => setTheme(theme === "dark" ? "daylight" : theme === "daylight" ? "sepia" : "dark")} aria-label="Text size and theme"><Sparkles size={16} /></button><button className="focus-ring od-icon-button od-accent" onClick={() => saveBookmark.mutate({ bookId: book.id, pageNumber: page })} aria-label="Save bookmark"><Bookmark size={16} /></button></div></header><main className="flex min-h-[calc(100vh-62px)] flex-col items-center px-4 pb-28 pt-10 md:pt-14"><div className="mb-6 flex w-full max-w-[760px] justify-between text-[.62rem] font-bold uppercase tracking-[.16em] od-muted"><span>Reading · {book.categoryName ?? "Other"}</span><span className="tabular-nums">{Math.round((page / pages) * 100)}% complete</span></div><article className={`reader-paper w-full max-w-[760px] ${pdfUrl ? "overflow-hidden" : "px-7 py-12 sm:px-14 sm:py-16 lg:px-20 lg:py-20"} ${paperClass}`} style={pdfUrl ? undefined : { fontSize: `${zoom}rem` }}>{pdfUrl ? <PdfDocument url={pdfUrl} pageNumber={page} zoom={zoom} onPageCount={setPdfPages} /> : <><p className="text-[.63rem] font-bold uppercase tracking-[.2em] opacity-60">{book.categoryName ?? "Other"} · Chapter {String(page).padStart(2, "0")}</p><h1 className="font-display mt-8 text-4xl leading-[1.15] sm:text-5xl">{book.title}</h1><p className="mt-4 text-sm opacity-65">{book.authorName}</p><div className="my-10 border-t border-current/15" /><p className="font-display text-[1.12rem] leading-[2] sm:text-[1.25rem]">{book.description}</p><p className="mt-8 text-sm leading-8 opacity-70">A stored PDF will appear here once an administrator uploads one for this book. Your progress and bookmarks are saved quietly in the background.</p></>}</article></main><ReaderToolbar page={page} pages={pages} zoom={zoom} theme={theme} onPage={setPage} onZoom={setZoom} onTheme={setTheme} onBookmark={() => saveBookmark.mutate({ bookId: book.id, pageNumber: page })} /></div>;
}
