/* ODHYAY — Quiet Editorial shared chrome. Minimal navbar, calm book cards, editorial sections. */
import { Link, useLocation } from "wouter";
import { ArrowRight, CircleUserRound, Menu, Search, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startGoogleLogin } from "@/const";
import { type Book } from "@/lib/odhyayData";
import { ThemeToggle } from "@/components/ThemeToggle";

export const ODHYAY_LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663030973859/TkJFcQVIhnmmxhdI.png";

export function Mark({ small = false }: { small?: boolean }) {
  return <img aria-hidden="true" src={ODHYAY_LOGO_URL} alt="" className={`${small ? "h-5 w-5" : "h-7 w-7"} shrink-0 rounded-[.28rem] object-cover shadow-sm`} />;
}

export function Logo() { return <Link href="/" className="focus-ring flex shrink-0 items-center gap-2.5" aria-label="ODHYAY home"><Mark /><span className="font-display text-[1.22rem] tracking-[.14em] sm:text-[1.3rem]">ODHYAY</span></Link>; }

export function Header() {
  const [open, setOpen] = useState(false); const [scrolled, setScrolled] = useState(false); const [location] = useLocation(); const { user, loading, logout } = useAuth();
  const nav = [{ href: "/library", label: "Library" }, { href: "/categories", label: "Categories" }, { href: "/about", label: "About" }];
  const accountLabel = user?.name?.split(" ")[0] || "Account"; const accountAction = () => { if (user) void logout(); else startGoogleLogin(); };
  useEffect(() => { setOpen(false); }, [location]);
  useEffect(() => { const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); }; window.addEventListener("keydown", closeOnEscape); return () => window.removeEventListener("keydown", closeOnEscape); }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);
  return <header className={`sticky top-0 z-40 border-b hairline od-surface-overlay backdrop-blur-xl transition-shadow duration-200 ${scrolled ? "site-nav-scrolled" : ""}`}><div className="container flex h-[62px] items-center justify-between gap-2 sm:h-[68px] sm:gap-6"><Logo /><nav className="site-nav hidden items-center md:flex" aria-label="Primary navigation">{nav.map((item) => <Link key={item.href} href={item.href} aria-current={location === item.href ? "page" : undefined} className={`focus-ring relative py-2 text-[.76rem] font-semibold tracking-[.08em] transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:bg-[var(--od-accent)] after:transition-transform ${location === item.href ? "od-accent after:scale-x-100" : "od-muted od-hover-accent after:scale-x-0"}`}>{item.label}</Link>)}</nav><div className="hidden items-center gap-1.5 md:flex"><Link href="/search" className="focus-ring od-button od-button-quiet" aria-label="Search the library"><Search size={16} /><span>Search</span></Link><ThemeToggle /><button disabled={loading} className="focus-ring od-button od-button-quiet disabled:opacity-50" onClick={accountAction}><CircleUserRound size={16} /><span>{user ? `Sign out ${accountLabel}` : "Account"}</span></button></div><div className="flex items-center gap-0.5 md:hidden"><Link href="/search" aria-label="Search the library" className="focus-ring od-icon-button od-ink"><Search size={19} /></Link><ThemeToggle compact /><button className="focus-ring od-icon-button od-ink" onClick={() => setOpen(value => !value)} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation">{open ? <X size={20} /> : <Menu size={21} />}</button></div></div><div id="mobile-navigation" className={`mobile-nav-drawer absolute inset-x-0 top-full max-h-[calc(100svh-62px)] overflow-y-auto overscroll-contain border-b hairline od-surface-overlay px-5 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl transition-[opacity,transform] duration-200 ${open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"} md:hidden`} aria-hidden={!open}><nav className="container flex flex-col py-3" aria-label="Mobile navigation">{nav.map((item) => <Link key={item.href} href={item.href} aria-current={location === item.href ? "page" : undefined} className={`focus-ring flex items-center justify-between border-b hairline py-4 text-[15px] font-semibold tracking-wide ${location === item.href ? "od-accent" : "od-ink"}`}><span>{item.label}</span><ArrowRight size={15} className="od-subtle" /></Link>)}<Link href="/search" className="focus-ring flex items-center justify-between border-b hairline py-4 text-[15px] font-semibold tracking-wide od-ink"><span className="flex items-center gap-2"><Search size={16} /> Search the library</span><ArrowRight size={15} className="od-subtle" /></Link><button disabled={loading} onClick={accountAction} className="focus-ring flex min-h-12 items-center gap-2 py-4 text-left text-[15px] font-semibold tracking-wide od-ink disabled:opacity-50"><CircleUserRound size={16} /> {user ? `Sign out ${accountLabel}` : "Continue with Google"}</button></nav></div></header>;
}

export function Footer() {
  return <footer className="border-t hairline py-14 sm:py-16">
    <div className="container">
      <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-start md:gap-16">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed od-muted">A calm digital library for curious minds.<br />Reading should feel quiet again.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm sm:gap-12 md:justify-items-end">
          <nav aria-label="Explore navigation" className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider od-subtle">Explore</span>
            <Link href="/library" className="focus-ring od-muted od-hover-ink">Library</Link>
            <Link href="/categories" className="focus-ring od-muted od-hover-ink">Categories</Link>
            <Link href="/search" className="focus-ring od-muted od-hover-ink">Search</Link>
          </nav>
          <nav aria-label="ODHYAY links" className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider od-subtle">ODHYAY</span>
            <Link href="/about" className="focus-ring od-muted od-hover-ink">About</Link>
            <a href="https://github.com/rafin610/odhyay" target="_blank" rel="noreferrer" className="focus-ring od-muted od-hover-ink">Source</a>
            <Link href="/about#philosophy" className="focus-ring od-muted od-hover-ink">Philosophy</Link>
          </nav>
        </div>
      </div>
      <div className="mt-12 flex flex-col gap-3 border-t hairline pt-8 text-xs od-subtle sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 ODHYAY. Quietly made for readers.</span>
        <span className="font-medium tracking-wide">Read with intention</span>
      </div>
    </div>
  </footer>;
}
export function PageFrame({ children, footer = true }: { children: React.ReactNode; footer?: boolean }) { return <div className="od-page min-h-screen overflow-x-clip"><Header /><div className="page-entrance">{children}</div>{footer && <Footer />}</div>; }
export function SectionLabel({ children, number }: { children: React.ReactNode; number?: string }) { return <div className="mb-6 flex items-center gap-3 od-muted"><span className="eyebrow">{number ? `${number} / ` : ""}{children}</span><span className="h-px flex-1" style={{ background: "var(--od-border)" }} /></div>; }

export function SectionHeading({ eyebrow, title, description, action, className }: { eyebrow: string; title: React.ReactNode; description?: string; action?: React.ReactNode; className?: string }) {
  return <div className={className ?? "mb-10 max-w-2xl sm:mb-12"}><p className="eyebrow od-accent">{eyebrow}</p><h2 className="font-display mt-4 text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.02] tracking-[-.02em]">{title}</h2>{description ? <p className="mt-4 max-w-xl text-[15px] leading-7 od-muted">{description}</p> : null}{action ? <div className="mt-5">{action}</div> : null}</div>;
}

export function CategoryFilter({ options, value, onChange }: { options: { slug?: string; name: string }[]; value?: string; onChange: (slug?: string) => void }) {
  return <div className="scrollbar-hidden -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0"><div className="flex w-max min-w-full flex-nowrap items-center gap-2" role="tablist" aria-label="Filter by category">{options.map((opt) => {
    const active = (value ?? undefined) === opt.slug;
    return <button key={opt.name} role="tab" aria-selected={active} aria-pressed={active} onClick={() => onChange(opt.slug)} className={`focus-ring od-pill ${active ? "od-pill-active" : ""}`}>{opt.name}</button>;
  })}</div></div>;
}

export function SearchBar({ compact = false, defaultValue = "" }: { compact?: boolean; defaultValue?: string }) { const [, setLocation] = useLocation(); const [value, setValue] = useState(defaultValue); const submit = (event: React.FormEvent) => { event.preventDefault(); setLocation(`/search${value.trim() ? `?q=${encodeURIComponent(value.trim())}` : ""}`); }; return <form onSubmit={submit} role="search" className={`group flex items-center gap-3 border-b transition-colors focus-within:border-[var(--od-accent)] ${compact ? "max-w-md" : "max-w-[620px]"}`} style={{ borderColor: "var(--od-border-strong)" }}><Search size={compact ? 17 : 19} className="shrink-0 od-muted transition-colors group-focus-within:od-accent" aria-hidden="true" /><input value={value} onChange={(event) => setValue(event.target.value)} className={`min-w-0 flex-1 bg-transparent py-3.5 od-ink outline-none placeholder:od-subtle ${compact ? "text-sm" : "text-[15px]"}`} placeholder="Search by title, author, or category" aria-label="Search books" autoComplete="off" inputMode="search" enterKeyHint="search" /><button className="focus-ring shrink-0 px-1 py-3.5 text-[.66rem] font-bold uppercase tracking-[.18em] od-accent">Search</button></form>; }

export function ReadingProgress({ value }: { value: number }) {
  return <div className="od-progress" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label="Reading progress"><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

export function BookCard({ book, index = 0 }: { book: Book; index?: number }) {
  const cleanCategory = (book.category ?? "").replace(/\.+$/, "");
  const cleanAuthor = (book.author ?? "").replace(/\.+$/, "");
  return <Link href={`/book/${book.slug}`} className={`book-card focus-ring group block reveal reveal-delay-${Math.min(index, 3)}`}>
    <div className="cover-frame relative aspect-[2/3] overflow-hidden cover-shadow">
      <div className="relative size-full overflow-hidden" style={{ background: "var(--od-surface-muted)" }}>
        <img src={book.cover} alt={`${book.title} cover`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
        {typeof book.progress === "number" ? <div className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: "color-mix(in srgb, var(--od-ink) 12%, transparent)" }}><div className="h-full" style={{ width: `${book.progress}%`, background: "var(--od-accent)" }} /></div> : null}
      </div>
    </div>
    <div className="book-meta pt-4">
      <h3 className="font-display text-[1.15rem] leading-[1.25] line-clamp-2 min-h-[2.85rem] od-ink">{book.title}</h3>
      <p className="mt-1.5 text-xs od-muted line-clamp-1">{cleanAuthor}</p>
      <p className="mt-1.5 text-xs font-semibold uppercase tracking-[.12em] od-subtle">{cleanCategory}</p>
    </div>
  </Link>;
}
export function BookGrid({ items }: { items: Book[] }) { const singleShelf = items.length === 1; const layout = singleShelf ? "grid-cols-1 max-w-[280px] sm:max-w-[320px]" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"; return <div className={`grid gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 lg:gap-x-8 ${layout}`}>{items.map((book, index) => <BookCard key={book.slug} book={book} index={index} />)}</div>; }
