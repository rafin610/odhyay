import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { getBookBySlug, toggleFavorite } = vi.hoisted(() => ({ getBookBySlug: vi.fn(), toggleFavorite: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false, logout: vi.fn(), isAuthenticated: false }) }));
vi.mock("@/const", () => ({ startGoogleLogin: vi.fn() }));
vi.mock("@/components/PdfDocument", () => ({ PdfDocument: () => <div data-testid="mock-pdf-document" /> }));
vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
  useLocation: () => ["/book/managed-cover", vi.fn()],
  useRoute: () => [true, { slug: "managed-cover" }],
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    library: { getBySlug: { useQuery: getBookBySlug } },
    reader: { toggleFavorite: { useMutation: toggleFavorite } },
  },
}));

import { BookCard } from "@/components/OdhyayShell";
import { BookPersistentPage } from "./OdhyayPersistent";

const managedCover = "/manus-storage/covers/90001/managed-cover.png";

afterEach(() => {
  cleanup();
  getBookBySlug.mockReset();
  toggleFavorite.mockReset();
});

describe("managed cover rendering", () => {
  it("uses a persisted managed cover path on public library cards", () => {
    render(<BookCard book={{ slug: "managed-cover", title: "Managed Cover", author: "ODHYAY QA", category: "Testing", pages: 1, cover: managedCover, description: "A stored cover." }} />);

    expect(screen.getByRole("img", { name: "Managed Cover cover" })).toHaveAttribute("src", managedCover);
  });

  it("uses a persisted managed cover path on the public book-detail page", () => {
    getBookBySlug.mockReturnValue({
      isLoading: false,
      error: null,
      data: {
        id: 1,
        title: "Managed Cover",
        slug: "managed-cover",
        description: "A stored cover.",
        coverUrl: managedCover,
        pdfKey: null,
        pdfFilename: null,
        pdfMimeType: null,
        pdfSize: null,
        pageCount: 1,
        status: "published",
        authorName: "ODHYAY QA",
        categoryName: "Testing",
        categorySlug: "testing",
      },
    });
    toggleFavorite.mockReturnValue({ mutate: vi.fn() });

    render(<BookPersistentPage />);

    expect(screen.getByRole("img", { name: "Managed Cover cover" })).toHaveAttribute("src", managedCover);
  });
});
