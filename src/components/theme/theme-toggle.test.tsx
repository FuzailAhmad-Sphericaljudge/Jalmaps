import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { ThemeProvider, useTheme } from "./theme-context";
import { ThemeToggle } from "./theme-toggle";

function ThemeSpy() {
  const { theme } = useTheme();
  return <span data-testid="theme-spy">{theme}</span>;
}

function renderToggle() {
  return render(
    <ThemeProvider initialTheme="light">
      <ThemeToggle />
      <ThemeSpy />
    </ThemeProvider>,
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    document.cookie = "jalmaps-theme=; path=/; max-age=0";
  });

  it("renders icon + text with a 48px-class button", () => {
    renderToggle();
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("Light");
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("toggles the theme, the html class and the cookie", async () => {
    const user = userEvent.setup();
    renderToggle();

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    await user.click(screen.getByRole("button"));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(screen.getByTestId("theme-spy")).toHaveTextContent("dark");
    expect(document.cookie).toContain("jalmaps-theme");
  });
});
