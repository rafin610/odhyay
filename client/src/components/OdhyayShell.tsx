/* ODHYAY style: Quiet Editorial — shared chrome uses editorial labels, hairline rules, warm ivory type, and soft amethyst focus. */
import { Link, useLocation } from "wouter";
import { ArrowRight, CircleUserRound, Menu, Search, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startGoogleLogin } from "@/const";
import { type Book } from "@/lib/odhyayData";

export function Mark({ small = false }: { small?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={small ? "h-5 w-5" : "h-7 w-7"} fill="none"><path d="M4 17V7" stroke="#B7A4D7" strokeWidth="2.5" strokeLinecap="round" /><path d="M9.3 17V4" stroke="#B7A4D7" strokeWidth="2.5" strokeLinecap="round" /><path d="M14.7 17v-7" stroke="#B7A4D7" strokeWidth="2.5" strokeLinecap="round" /><path d="M20 17V6" stroke="#B7A4D7" strokeWidth="2.5" strokeLinecap="round" /></svg>;
}

export function Logo() {
  return <Link href="/" className="focus-ring flex shrink-0 items-center gap-2.5" aria-label="ODHYAY home"><Mark /><span className="font-display text-[1.25rem] tracking-[.16em] sm:text-[1.35rem]">ODHYAY</span></Link>;
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user, loading, logout } = useAuth();
  const nav = [{ href: "/library", label: "Library" }, { href: "/categories", label: "Categories" }, { href: "/about", label: "About" }];
  const accountLabel = user?.name?.split(" ")[0] || "Account";
  const accountAction = () => { if (user) void logout(); else startGoogleLogin(); };

  useEffect(() => { setOpen(false); }, [location]);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return <header className="sticky top-0 z-40 border-b hairline bg-[#111015]/95 backdrop-blur-xl">
    <div className="container flex h-[68px] items-center justify-between gap-4 sm:h-[76px] sm:gap-6">
      <Logo />
      <nav className="site-nav hidden items-center md:flex" aria-label="Primary navigation">
        {nav.map((item) => <Link key={item.href} href={item.href} aria-current={location === item.href ? "page" : undefined} className={`focus-ring relative py-2 text-[.76rem] font-semibold tracking-[.08em] transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:bg-[#b7a4d7] after:transition-transform ${location === item.href ? "text-amethyst after:scale-x-100" : "text-[#b5afbb] hover:text-amethyst after:scale-x-0"}`}>{item.label}</Link>)}
      </nav>
      <div className="hidden items-center gap-4 md:flex">
        <Link href="/search" className="focus-ring flex items-center gap-2 text-[#b5afbb] hover:text-[#f3eee6]" aria-label="Search the library"><Search size={17} /><span className="text-[.72rem] font-semibold uppercase tracking-[.14em]">Search</span></Link>
        <span className="h-5 w-px bg-[#332d39]" />
        <button disabled={loading} className="focus-ring flex items-center gap-2 text-[#b5afbb] hover:text-[#f3eee6] disabled:opacity-50" onClick={accountAction}><CircleUserRound size={17} /><span className="text-[.72rem] font-semibold uppercase tracking-[.14em]">{user ? `Sign out ${accountLabel}` : "Continue with Google"}</span></button>
      </div>
      <button className="focus-ring grid size-10 place-items-center rounded-sm border border-transparent text-[#f3eee6] hover:border-[#4a4052] md:hidden" onClick={() => setOpen(value => !value)} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation">{open ? <X size={20} /> : <Menu size={21} />}</button>
    </div>
    <div id="mobile-navigation" className={`absolute inset-x-0 top-full border-b hairline bg-[#151219]/98 px-5 shadow-2xl backdrop-blur-xl transition-[opacity,transform] duration-200 ${open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"} md:hidden`} aria-hidden={!open}>
      <nav className="container flex flex-col py-3" aria-label="Mobile navigation">
        {nav.map((item) => <Link key={item.href} href={item.href} aria-current={location === item.href ? "page" : undefined} className={`focus-ring flex items-center justify-between border-b hairline py-4 text-sm font-semibold tracking-wide ${location === item.href ? "text-amethyst" : "text-[#d9d2dd]"}`}><span>{item.label}</span><ArrowRight size={15} className="text-[#817989]" /></Link>)}
        <Link href="/search" className="focus-ring flex items-center justify-between border-b hairline py-4 text-sm font-semibold tracking-wide text-[#d9d2dd]"><span className="flex items-center gap-2"><Search size={16} /> Search the library</span><ArrowRight size={15} className="text-[#817989]" /></Link>
        <button disabled={loading} onClick={accountAction} className="focus-ring flex items-center gap-2 py-4 text-left text-sm font-semibold tracking-wide text-[#d9d2dd] disabled:opacity-50"><CircleUserRound size={16} /> {user ? "Sign out" : "Continue with Google"}</button>
      </nav>
    </div>
  </header>;
}

export function Footer() {
  return <footer className="border-t hairline bg-[#0d0c10] py-10 sm:py-12"><div className="container flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><Logo /><p className="mt-5 max-w-xs text-sm leading-7 text-[#8f8996]">A calm digital library for curious minds. Find a book. Open it. Read.</p></div><div className="flex flex-col gap-4 text-xs text-[#8f8996] md:items-end"><div className="flex gap-5"><Link href="/about" className="focus-ring hover:text-[#f3eee6]">About</Link><Link href="/library" className="focus-ring hover:text-[#f3eee6]">Library</Link><Link href="/admin" className="focus-ring hover:text-[#f3eee6]">Admin</Link></div><span>© 2026 ODHYAY. Quietly made for readers.</span></div></div></footer>;
}

export function PageFrame({ children, footer = true }: { children: React.ReactNode; footer?: boolean }) {
  return <div className="min-h-screen bg-[#111015] text-[#f3eee6]"><Header /><div className="page-entrance">{children}</div>{footer && <Footer />}</div>;
}

export function SectionLabel({ children, number }: { children: React.ReactNode; number?: string }) {
  return <div className="mb-5 flex items-center gap-3 text-[#928b9a]"><Mark small /><span className="eyebrow">{number ? `${number} / ` : ""}{children}</span><span className="h-px flex-1 bg-[#332d39]" /></div>;
}

export function SearchBar({ compact = false, defaultValue = "" }: { compact?: boolean; defaultValue?: string }) {
  const [, setLocation] = useLocation();
  const [value, setValue] = useState(defaultValue);
  const submit = (event: React.FormEvent) => { event.preventDefault(); setLocation(`/search${value.trim() ? `?q=${encodeURIComponent(value.trim())}` : ""}`); };
  return <form onSubmit={submit} className={`group flex items-center gap-3 border-b border-[#5a5163] transition-colors focus-within:border-[#b7a4d7] ${compact ? "max-w-md" : "max-w-[620px]"}`}><Search size={compact ? 17 : 20} className="shrink-0 text-[#8f8996] transition-colors group-focus-within:text-amethyst" /><input value={value} onChange={(event) => setValue(event.target.value)} className={`min-w-0 flex-1 bg-transparent py-4 text-[#f3eee6] outline-none placeholder:text-[#716b77] ${compact ? "text-sm" : "text-base"}`} placeholder="Search by title, author, or category" aria-label="Search books" autoComplete="off" inputMode="search" enterKeyHint="search" /><button className="focus-ring shrink-0 px-1 py-4 text-[.66rem] font-bold uppercase tracking-[.18em] text-amethyst">Search</button></form>;
}

export function BookCard({ book, index = 0 }: { book: Book; index?: number }) {
  return <Link href={`/book/${book.slug}`} className={`book-card focus-ring group block reveal reveal-delay-${Math.min(index, 3)}`}><div className="cover-frame relative aspect-[2/3] overflow-hidden cover-shadow"><div className="relative size-full overflow-hidden bg-[#24202a]"><img src={book.cover} alt={`${book.title} cover`} className="h-full w-full object-cover" loading="lazy" decoding="async" /><div className="absolute inset-0 bg-gradient-to-t from-[#111015]/45 via-transparent to-transparent opacity-80" /><span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate bg-[#111015]/80 px-2 py-1 text-[.58rem] font-bold uppercase tracking-[.16em] text-[#ddd4e5]">{book.category}</span>{book.progress ? <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#302a35]"><div className="h-full bg-[#b7a4d7]" style={{ width: `${book.progress}%` }} /></div> : null}</div></div><div className="book-meta pt-4"><h3 className="font-display text-[1.3rem] leading-tight text-[#f3eee6] transition-colors group-hover:text-amethyst sm:text-[1.35rem]">{book.title}</h3><p className="mt-2 truncate text-xs text-[#938b9b]">{book.author}</p><div className="mt-3 flex items-center gap-2 text-[.61rem] font-bold uppercase tracking-[.14em] text-[#706a77]"><span>{book.pages} pages</span><span className="h-1 w-1 rounded-full bg-[#645b6c]" /><span className="truncate">{book.category}</span></div></div></Link>;
}

export function BookGrid({ items }: { items: Book[] }) {
  const singleShelf = items.length === 1;
  const layout = singleShelf ? "grid-cols-1 max-w-[300px] sm:max-w-[340px]" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  return <div className={`grid gap-x-3 gap-y-9 sm:gap-x-6 sm:gap-y-12 lg:gap-x-8 lg:gap-y-14 ${layout}`}>{items.map((book, index) => <BookCard key={book.slug} book={book} index={index} />)}</div>;
}
