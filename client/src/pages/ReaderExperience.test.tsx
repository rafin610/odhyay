import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { getBookBySlug, saveProgress, addBookmark, refetchBook } = vi.hoisted(() => ({ getBookBySlug: vi.fn(), saveProgress: vi.fn(), addBookmark: vi.fn(), refetchBook: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: false }) }));
vi.mock("@/components/OdhyayShell", () => ({ PageFrame: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, Mark: () => <span>Mark</span> }));
vi.mock("@/components/PdfDocument", () => ({ PdfDocument: ({ url }: { url: string }) => <div data-testid="managed-pdf" data-url={url}>Managed PDF</div> }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>, useRoute: () => [true, { slug: "reader-test" }] }));
vi.mock("@/lib/trpc", () => ({ trpc: { library: { getBySlug: { useQuery: getBookBySlug } }, reader: { saveProgress: { useMutation: saveProgress }, addBookmark: { useMutation: addBookmark } } } }));

import ReaderExperience from "./ReaderExperience";

type TestBook = {
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

const book: TestBook = {
  id: 44,
  title: "Reader Test",
  slug: "reader-test",
  description: "A quiet reading preview.",
  coverUrl: null,
  pdfKey: null,
  pdfFilename: null,
  pdfMimeType: null,
  pdfSize: null,
  pageCount: 3,
  authorName: "ODHYAY QA",
  categoryName: "Testing",
};

afterEach(() => {
  cleanup();
  localStorage.clear();
  getBookBySlug.mockReset();
  saveProgress.mockReset();
  addBookmark.mockReset();
  refetchBook.mockReset();
});

function prepare(data: TestBook | undefined, isLoading = false) {
  getBookBySlug.mockReturnValue({ data, isLoading, error: data || isLoading ? null : new Error("Missing"), refetch: refetchBook });
  saveProgress.mockReturnValue({ mutate: vi.fn() });
  addBookmark.mockReturnValue({ mutate: vi.fn(), isPending: false });
}

describe("ReaderExperience", () => {
  it("offers a focused preview reading room and an accessible mobile-first toolbar", () => {
    prepare(book);
    render(<ReaderExperience />);

    expect(screen.getByRole("heading", { name: "Reader Test" })).toBeInTheDocument();
    expect(screen.getByText("Document preview")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change reading paper appearance" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Change reading paper appearance" }));
    expect(screen.getByText("Daylight")).toBeInTheDocument();
  });

  it("sends a managed PDF to the same-origin document renderer", () => {
    prepare({ ...book, pdfKey: "books/reader-test.pdf", pdfFilename: "reader-test.pdf", pdfMimeType: "application/pdf", pdfSize: 1024 });
    render(<ReaderExperience />);

    expect(screen.getByTestId("managed-pdf")).toHaveAttribute("data-url", "/api/reader/pdf/reader-test");
  });

  it("shows a recoverable unavailable-reading-room state", () => {
    prepare(undefined);
    render(<ReaderExperience />);

    expect(screen.getByText("This reading room is unavailable.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetchBook).toHaveBeenCalledOnce();
  });

  it("keeps a stable hook order while the book query transitions from loading to loaded", () => {
    prepare(undefined, true);
    const view = render(<ReaderExperience />);

    prepare(book);
    expect(() => view.rerender(<ReaderExperience />)).not.toThrow();
    expect(screen.getByRole("heading", { name: "Reader Test" })).toBeInTheDocument();
  });

  it("keeps fullscreen entry accessible from the focused reader toolbar", () => {
    prepare(book);
    render(<ReaderExperience />);

    expect(screen.getByRole("button", { name: "Enter full screen" })).toBeInTheDocument();
  });

  it("advances a page from a fullscreen wheel gesture", async () => {
    let fullscreenElement: Element | null = null;
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => fullscreenElement });
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      configurable: true,
      value: function requestFullscreen(this: HTMLElement) {
        fullscreenElement = this;
        document.dispatchEvent(new Event("fullscreenchange"));
        return Promise.resolve();
      },
    });
    prepare(book);
    render(<ReaderExperience />);

    fireEvent.click(screen.getByRole("button", { name: "Enter full screen" }));
    fireEvent.wheel(screen.getByText(/Reading · Testing/), { deltaY: 80 });

    expect(await screen.findByText("67% complete")).toBeInTheDocument();
  });
});
