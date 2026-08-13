/* ODHYAY style: Quiet Editorial — near-black reading-room surfaces, warm ivory type, and restrained Chapter Amethyst accents. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AboutPage, AdminBooksPage, AdminDashboardPage, AdminNewBookPage, BookPage, CategoriesPage, HomePage, LibraryPage, ReaderPage, SearchPage } from "./pages/Odhyay";

function Router() {
  return <Switch>
    <Route path="/" component={HomePage} /><Route path="/library" component={LibraryPage} />
    <Route path="/categories" component={CategoriesPage} /><Route path="/search" component={SearchPage} />
    <Route path="/book/:slug" component={BookPage} /><Route path="/read/:slug" component={ReaderPage} />
    <Route path="/about" component={AboutPage} /><Route path="/admin" component={AdminDashboardPage} />
    <Route path="/admin/books" component={AdminBooksPage} /><Route path="/admin/books/new" component={AdminNewBookPage} />
    <Route path="/404" component={NotFound} /><Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
