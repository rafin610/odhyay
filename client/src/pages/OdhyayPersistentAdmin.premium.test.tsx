import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { setUserRole } = vi.hoisted(() => ({ setUserRole: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { role: "admin", openId: "admin-test" }, loading: false }),
}));
vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
  useLocation: () => ["/admin", vi.fn()],
}));
vi.mock("@/components/OdhyayShell", () => ({ Mark: () => <span>Mark</span>, Logo: () => <span>ODHYAY</span> }));
vi.mock("@/components/ThemeToggle", () => ({ ThemeToggle: () => <button type="button">Theme</button> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ admin: { listBooks: { invalidate: vi.fn() }, listUsers: { invalidate: vi.fn() } }, library: { list: { invalidate: vi.fn() }, categories: { invalidate: vi.fn() }, getBySlug: { invalidate: vi.fn() } } }),
    admin: {
      listBooks: { useQuery: () => ({ data: [{ id: 1, title: "Premium Test", slug: "premium-test", description: "A test record", coverUrl: null, pdfKey: null, pdfFilename: null, pdfMimeType: null, pdfSize: null, authorName: "ODHYAY", categoryName: "Testing", status: "published", pageCount: 1, updatedAt: new Date() }], isLoading: false }) },
      updateBook: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      deleteBook: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      listUsers: { useQuery: () => ({ data: [{ id: 2, openId: "reader-test", name: "Reader Test", email: "reader@example.com", loginMethod: "google", role: "user", lastSignedIn: new Date() }], isLoading: false }) },
      setUserRole: { useMutation: () => ({ isPending: false, mutate: setUserRole }) },
    },
  },
}));

import { AdminPersistentAccessPage, AdminPersistentDashboardPage } from "./OdhyayPersistentAdmin";

afterEach(cleanup);

describe("administrator premium controls", () => {
  it("renders a focusable premium primary action in the authenticated workspace", () => {
    render(<AdminPersistentDashboardPage />);

    const addBook = screen.getByRole("link", { name: /add a book/i });
    expect(addBook).toHaveClass("od-button", "od-button-primary");
    addBook.focus();
    expect(addBook).toHaveFocus();
  });

  it("executes a focusable premium access-management action", () => {
    setUserRole.mockReset();
    render(<AdminPersistentAccessPage />);

    const roleAction = screen.getAllByRole("button", { name: "Make admin" })[0]!;
    expect(roleAction).toHaveClass("od-button", "od-button-outline");
    roleAction.focus();
    expect(roleAction).toHaveFocus();
    fireEvent.click(roleAction);

    expect(setUserRole).toHaveBeenCalledWith({ openId: "reader-test", role: "admin" });
  });
});
