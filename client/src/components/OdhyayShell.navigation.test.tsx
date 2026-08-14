import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false, logout: vi.fn() }) }));
vi.mock("@/const", () => ({ startGoogleLogin: vi.fn() }));
vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>, useLocation: () => ["/library", vi.fn()] }));

import { Header } from "./OdhyayShell";

afterEach(cleanup);

describe("ODHYAY responsive navigation", () => {
  it("opens a dedicated mobile navigation panel and supports Escape to close it", () => {
    render(<Header />);
    const toggle = screen.getByRole("button", { name: "Open navigation" });
    fireEvent.click(toggle);

    const mobileNavigation = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(mobileNavigation).toBeVisible();
    expect(within(mobileNavigation).getByRole("link", { name: "Search the library" })).toBeInTheDocument();
    expect(mobileNavigation.parentElement).toHaveAttribute("aria-hidden", "false");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(mobileNavigation.parentElement).toHaveAttribute("aria-hidden", "true");
  });
});
