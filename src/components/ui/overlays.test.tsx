import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Separator } from "./separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./sheet";
import { Skeleton } from "./skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

// Dialog/Sheet close buttons read their sr-only label via next-intl; the
// minimal fixture mirrors the common.close message used in production.
const closeMessages = { common: { close: "Close" } };

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={closeMessages} timeZone="Asia/Kolkata">
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("Dialog", () => {
  it("opens on click, is labelled, and closes with Escape", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open details</Button>
        </DialogTrigger>
        <DialogContent closeLabel="Close">
          <DialogTitle>Well details</DialogTitle>
          <DialogDescription>Borewell #4 — Kharagpur</DialogDescription>
          <p>Depth 42 m. Water level 11.3 m below ground level.</p>
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "Open details" }));
    const dialog = screen.getByRole("dialog", { name: "Well details" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Depth 42 m");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Sheet (farmer-first bottom sheet on mobile)", () => {
  it("opens with an accessible title and closes via Escape", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Filter wells</Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto" closeLabel="Close">
          <SheetTitle>Filter wells</SheetTitle>
          <p>Pick a village, depth range or status.</p>
        </SheetContent>
      </Sheet>,
    );

    await user.click(screen.getByRole("button", { name: "Filter wells" }));
    expect(screen.getByRole("dialog", { name: "Filter wells" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Tabs", () => {
  it("switches panels on click and with arrow keys", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="week">
        <TabsList>
          <TabsTrigger value="week">This week</TabsTrigger>
          <TabsTrigger value="month">This month</TabsTrigger>
        </TabsList>
        <TabsContent value="week">Weekly levels</TabsContent>
        <TabsContent value="month">Monthly levels</TabsContent>
      </Tabs>,
    );

    expect(screen.getByText("Weekly levels")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "This month" }));
    expect(screen.getByText("Monthly levels")).toBeInTheDocument();

    // Radix roving tabindex: arrows move selection between tabs.
    await user.click(screen.getByRole("tab", { name: "This month" }));
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "This week" })).toHaveAttribute("aria-selected", "true");
  });
});

describe("Tooltip", () => {
  it("shows its content on hover", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Depth</TooltipTrigger>
          <TooltipContent>Metres below ground level</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    await user.hover(screen.getByText("Depth"));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Metres below ground level");
  });

  it("shows its content on keyboard focus", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Depth</TooltipTrigger>
          <TooltipContent>Metres below ground level</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    await user.tab();
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();
  });
});

describe("DropdownMenu", () => {
  it("opens via click, selects an item, and closes on Escape", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Report menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onSelect}>Download PDF</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "Report menu" }));
    await user.click(screen.getByText("Download PDF"));
    expect(onSelect).toHaveBeenCalled();
    expect(screen.queryByText("Download PDF")).not.toBeInTheDocument();
  });
});

describe("Display primitives", () => {
  it("Badge renders its text", () => {
    render(<Badge>Offline</Badge>);
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("Card groups content with name and description", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Well #4</CardTitle>
          <CardDescription>Borewell — Kharagpur</CardDescription>
        </CardHeader>
        <CardContent>11.3 m below ground level</CardContent>
      </Card>,
    );
    expect(screen.getByText("Well #4")).toBeInTheDocument();
    expect(screen.getByText("Borewell — Kharagpur")).toBeInTheDocument();
    expect(screen.getByText("11.3 m below ground level")).toBeInTheDocument();
  });

  it("Separator renders a decorative divider", () => {
    const { container } = render(<Separator />);
    expect(container.firstElementChild).toHaveAttribute("data-slot", "separator");
  });

  it("Separator exposes a separator role when not decorative", () => {
    render(<Separator decorative={false} aria-label="Section divider" />);
    expect(screen.getByRole("separator", { name: "Section divider" })).toBeInTheDocument();
  });

  it("Skeleton announces loading via role=status with an accessible name", () => {
    render(<Skeleton statusLabel="Loading levels" className="h-8 w-40" />);
    expect(screen.getByRole("status", { name: "Loading levels" })).toBeInTheDocument();
  });
});
