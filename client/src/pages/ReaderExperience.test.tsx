import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { getBookBySlug, getProgress, saveProgress, addBookmark, refetchBook } = vi.hoisted(() => ({ getBookBySlug: vi.fn(), getProgress: vi.fn(), saveProgress: vi.fn(), addBookmark: vi.fn(), refetchBook: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock("@/components/OdhyayShell", () => ({ PageFrame: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/ThemeToggle", () => ({ ThemeToggle: () => <button type="button" aria-label="Switch global theme">Global theme</button> }));
vi.mock("@/components/ContinuousPdfReader", () => ({
  clampReaderProgress: (value: number | undefined) => Math.max(0, Math.min(100, Math.round(value ?? 0))),
  ContinuousPdfReader: ({ url, initialPage, initialProgress, zoom, scrollContainer, onVisiblePage, onProgress }: { url: string; initialPage: number; initialProgress: number; zoom: number; scrollContainer?: HTMLElement | null; onVisiblePage: (page: number) => void; onProgress: (progress: number) => void }) => <div data-testid="continuous-pdf" data-url={url} data-initial-page={initialPage} data-initial-progress={initialProgress} data-zoom={zoom} data-scroll-container={scrollContainer ? "reader-root" : "window"}><button type="button" onClick={() => onVisiblePage(2)}>Report page two</button><button type="button" onClick={() => onProgress(51)}>Report 51% progress</button></div>,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>, useRoute: () => [true, { slug: "reader-test" }] }));
vi.mock("@/lib/trpc", () => ({ trpc: { library: { getBySlug: { useQuery: getBookBySlug } }, reader: { getProgress: { useQuery: getProgress }, saveProgress: { useMutation: saveProgress }, addBookmark: { useMutation: addBookmark } } } }));

import ReaderExperience from "./ReaderExperience";

type TestBook = { id: number; title: string; slug: string; description: string; coverUrl: string | null; pdfKey: string | null; pdfFilename: string | null; pdfMimeType: string | null; pdfSize: number | null; pageCount: number; authorName: string; categoryName: string | null };
const book: TestBook = { id: 44, title: "Reader Test", slug: "reader-test", description: "A quiet reading preview.", coverUrl: null, pdfKey: "books/reader-test.pdf", pdfFilename: "reader-test.pdf", pdfMimeType: "application/pdf", pdfSize: 1024, pageCount: 3, authorName: "ODHYAY QA", categoryName: "Testing" };

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage.clear();
  getBookBySlug.mockReset();
  getProgress.mockReset();
  saveProgress.mockReset();
  addBookmark.mockReset();
  refetchBook.mockReset();
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
});

function prepare(data: TestBook | undefined, saved = { currentPage: 1, progressPercentage: 0 }, isLoading = false) {
  getBookBySlug.mockReturnValue({ data, isLoading, error: data || isLoading ? null : new Error("Missing"), refetch: refetchBook });
  getProgress.mockReturnValue({ data: saved, isLoading: false });
  saveProgress.mockReturnValue({ mutate: vi.fn() });
  addBookmark.mockReturnValue({ mutate: vi.fn(), isPending: false });
}

describe("ReaderExperience", () => {
  it("uses the same-origin PDF stream in a continuous reader without page-turn controls", () => {
    prepare(book);
    render(<ReaderExperience />);

    expect(screen.getByTestId("continuous-pdf")).toHaveAttribute("data-url", "/api/reader/pdf/reader-test");
    expect(screen.queryByRole("button", { name: "Previous page" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next page" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fit pages to width" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enter full screen" })).toBeInTheDocument();
  });

  it("keeps direct zoom in, zoom out, and fit-width actions available for phone reader controls", () => {
    prepare(book);
    render(<ReaderExperience />);

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByTestId("continuous-pdf")).toHaveAttribute("data-zoom", "1.1");
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(screen.getByTestId("continuous-pdf")).toHaveAttribute("data-zoom", "1");
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    fireEvent.click(screen.getByRole("button", { name: "Fit pages to width" }));
    expect(screen.getByTestId("continuous-pdf")).toHaveAttribute("data-zoom", "1");
  });

  it("routes fullscreen reading through the reader root so phone vertical scrolling stays available", async () => {
    prepare(book);
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      configurable: true,
      value: function requestFullscreen(this: HTMLElement) {
        Object.defineProperty(document, "fullscreenElement", { configurable: true, value: this });
        document.dispatchEvent(new Event("fullscreenchange"));
        return Promise.resolve();
      },
    });
    render(<ReaderExperience />);

    fireEvent.click(screen.getByRole("button", { name: "Enter full screen" }));
    await waitFor(() => expect(screen.getByTestId("continuous-pdf")).toHaveAttribute("data-scroll-container", "reader-root"));
    expect(document.querySelector(".reader-continuous-shell")).toHaveClass("reader-fullscreen");
  });

  it("restores saved current page and percentage before opening the document", () => {
    prepare(book, { currentPage: 3, progressPercentage: 64 });
    render(<ReaderExperience />);

    expect(screen.getByTestId("continuous-pdf")).toHaveAttribute("data-initial-page", "3");
    expect(screen.getByTestId("continuous-pdf")).toHaveAttribute("data-initial-progress", "64");
    expect(screen.getByText("64%")).toBeInTheDocument();
  });

  it("debounces meaningful reader progress saves", () => {
    vi.useFakeTimers();
    const mutate = vi.fn();
    prepare(book);
    saveProgress.mockReturnValue({ mutate });
    render(<ReaderExperience />);

    fireEvent.click(screen.getByRole("button", { name: "Report page two" }));
    fireEvent.click(screen.getByRole("button", { name: "Report 51% progress" }));
    vi.advanceTimersByTime(649);
    expect(mutate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(mutate).toHaveBeenCalledWith({ bookId: 44, currentPage: 2, progressPercentage: 51 });
  });

  it("auto-hides its minimal chrome while the reader moves down the document", () => {
    prepare(book);
    render(<ReaderExperience />);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 120 });
    fireEvent.scroll(window);

    expect(document.querySelector(".reader-continuous-chrome")).toHaveClass("reader-chrome-hidden");
  });

  it("keeps reader paper appearance and global theme controls distinct", () => {
    prepare(book);
    render(<ReaderExperience />);
    fireEvent.click(screen.getByRole("button", { name: /Change reading paper appearance/ }));

    expect(document.querySelector(".reader-continuous-shell")).toHaveClass("reader-room-daylight");
    expect(screen.getByRole("button", { name: "Switch global theme" })).toBeInTheDocument();
  });

  it("shows a recoverable unavailable-reading-room state", () => {
    prepare(undefined);
    render(<ReaderExperience />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetchBook).toHaveBeenCalledOnce();
  });
});
