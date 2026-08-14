/* ODHYAY style: Quiet Editorial — near-black reading-room surfaces, warm ivory type, and restrained Chapter Amethyst accents. */
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const loadPersistent = () => import("./pages/OdhyayPersistent");
const HomePersistentPage = lazy(async () => ({ default: (await loadPersistent()).HomePersistentPage }));
const LibraryPersistentPage = lazy(async () => ({ default: (await loadPersistent()).LibraryPersistentPage }));
const CategoriesPersistentPage = lazy(async () => ({ default: (await loadPersistent()).CategoriesPersistentPage }));
const SearchPersistentPage = lazy(async () => ({ default: (await loadPersistent()).SearchPersistentPage }));
const BookPersistentPage = lazy(async () => ({ default: (await loadPersistent()).BookPersistentPage }));
const ReaderPersistentPage = lazy(() => import("./pages/ReaderExperience"));
const AboutPage = lazy(async () => ({ default: (await import("./pages/Odhyay")).AboutPage }));
const NotFound = lazy(() => import("./pages/NotFound"));

const loadAdmin = () => import("./pages/OdhyayPersistentAdmin");
const AdminPersistentDashboardPage = lazy(async () => ({ default: (await loadAdmin()).AdminPersistentDashboardPage }));
const AdminPersistentBooksPage = lazy(async () => ({ default: (await loadAdmin()).AdminPersistentBooksPage }));
const AdminPersistentNewBookPage = lazy(async () => ({ default: (await loadAdmin()).AdminPersistentNewBookPage }));
const AdminPersistentAccessPage = lazy(async () => ({ default: (await loadAdmin()).AdminPersistentAccessPage }));

function PageLoading() {
  return <div className="grid min-h-screen place-items-center bg-[#111015] px-6 text-center text-[#f3eee6]"><div><p className="eyebrow text-amethyst">ODHYAY</p><p className="mt-4 text-sm text-[#9b93a1]">Opening a quiet page…</p></div></div>;
}

function Router() {
  return <Suspense fallback={<PageLoading />}><Switch>
    <Route path="/" component={HomePersistentPage} /><Route path="/library" component={LibraryPersistentPage} />
    <Route path="/categories" component={CategoriesPersistentPage} /><Route path="/search" component={SearchPersistentPage} />
    <Route path="/book/:slug" component={BookPersistentPage} /><Route path="/read/:slug" component={ReaderPersistentPage} />
    <Route path="/about" component={AboutPage} /><Route path="/admin" component={AdminPersistentDashboardPage} />
    <Route path="/admin/books" component={AdminPersistentBooksPage} /><Route path="/admin/books/new" component={AdminPersistentNewBookPage} /><Route path="/admin/access" component={AdminPersistentAccessPage} />
    <Route path="/404" component={NotFound} /><Route component={NotFound} />
  </Switch></Suspense>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
