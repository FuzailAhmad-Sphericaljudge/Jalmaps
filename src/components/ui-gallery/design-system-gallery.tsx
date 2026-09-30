"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  LoadingState,
} from "@/components/jalmaps/state-components";
import { LogoMark, Wordmark } from "@/components/jalmaps/logo";
import { StatTile } from "@/components/jalmaps/stat-tile";
import { StatusPill } from "@/components/jalmaps/status-pill";
import { TrendArrow } from "@/components/jalmaps/trend-arrow";
import { WaterGauge } from "@/components/jalmaps/water-gauge";
import { WellTank } from "@/components/jalmaps/well-tank";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const STATUS_SWATCHES = [
  { name: "primary", label: "Primary (water)", className: "bg-primary" },
  { name: "success", label: "Success (good)", className: "bg-success" },
  { name: "warning", label: "Warning (amber)", className: "bg-warning" },
  { name: "danger", label: "Critical (red)", className: "bg-danger" },
  { name: "offline", label: "Offline (grey)", className: "bg-offline" },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && <p className="text-sm text-foreground-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

export function DesignSystemGallery() {
  const [largeText, setLargeText] = useState(false);

  const toggleLargeText = () => {
    setLargeText((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("text-large", next);
      return next;
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-8">
      {/* Sticky toolbar: theme + large text toggles */}
      <div className="z-dropdown sticky top-0 flex items-center gap-3 bg-background/95 py-3 backdrop-blur">
        <Wordmark />
        <span className="flex-1" />
        <ThemeToggle />
        <Button
          variant="outline"
          aria-pressed={largeText}
          onClick={toggleLargeText}
          title="Toggle large text"
        >
          <span aria-hidden className="text-base leading-none">
            A
          </span>
          <span aria-hidden className="text-sm leading-none">
            A
          </span>
          Large text
        </Button>
      </div>

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Design system</h1>
        <p className="text-foreground-muted">
          Every JalMaps component and state, in light and dark, with large-text preview.
          Farmer-first: 48px touch targets, icon + text, never colour alone.
        </p>
      </header>

      <Section title="Brand">
        <Row>
          <LogoMark title="JalMaps logo" />
          <Wordmark />
        </Row>
      </Section>

      <Section title="Colour tokens" description="Status is always paired with icon + text.">
        <Row>
          {STATUS_SWATCHES.map((swatch) => (
            <div key={swatch.name} className="flex flex-col items-center gap-1">
              <span
                aria-hidden
                className={`size-12 rounded-lg border border-border ${swatch.className}`}
              />
              <span className="text-xs text-foreground-muted">{swatch.label}</span>
            </div>
          ))}
        </Row>
      </Section>

      <Section title="Type scale">
        <div className="flex flex-col gap-1">
          <span className="text-xs">Text xs — labels</span>
          <span className="text-sm">Text sm — secondary</span>
          <span className="text-base">Text base — body</span>
          <span className="text-lg">Text lg — emphasis</span>
          <span className="text-xl">Text xl — section title</span>
          <span className="text-2xl">Text 2xl — data value</span>
          <span className="text-3xl">Text 3xl — page title</span>
        </div>
      </Section>

      <Section title="Buttons" description="`touch` sizes meet the 48px minimum.">
        <Row>
          <Button size="touch">Primary</Button>
          <Button variant="outline" size="touch">
            Outline
          </Button>
          <Button variant="secondary" size="touch">
            Secondary
          </Button>
          <Button variant="ghost" size="touch">
            Ghost
          </Button>
          <Button variant="destructive" size="touch">
            Destructive
          </Button>
          <Button variant="link" size="touch">
            Link
          </Button>
        </Row>
        <Row>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon-touch" aria-label="Refresh levels">
            ↻
          </Button>
          <Button size="touch" disabled>
            Disabled
          </Button>
        </Row>
      </Section>

      <Section title="Badges, separator, skeleton">
        <Row>
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </Row>
        <Separator />
        <div className="flex flex-col gap-2">
          <Skeleton statusLabel="Loading levels" className="h-6 w-64" />
          <LoadingSkeleton label="Loading tile" />
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Well #4</CardTitle>
              <CardDescription>Borewell — Kharagpur</CardDescription>
            </CardHeader>
            <CardContent>11.3 m below ground level</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Borewell #9</CardTitle>
              <CardDescription>Group well — Amravati</CardDescription>
            </CardHeader>
            <CardContent>28 m below ground level</CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Form controls" description="Every control labelled, 48px class targets.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="g-village">Village name</label>
            <Input id="g-village" placeholder="Kharagpur" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="g-notes">Notes</label>
            <Textarea id="g-notes" placeholder="Well observations…" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="g-district">District</label>
            <Select>
              <SelectTrigger id="g-district">
                <SelectValue placeholder="Choose district" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nagpur">Nagpur</SelectItem>
                <SelectItem value="amravati">Amravati</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm">Alerts</legend>
            <label className="flex items-center gap-2">
              <Checkbox /> SMS alerts
            </label>
            <label className="flex items-center gap-2">
              <Checkbox defaultChecked /> Voice calls
            </label>
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm">Units</legend>
            <RadioGroup defaultValue="m" className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <RadioGroupItem value="m" /> Metres
              </label>
              <label className="flex items-center gap-2">
                <RadioGroupItem value="ft" /> Feet
              </label>
            </RadioGroup>
          </fieldset>
          <label className="flex items-center gap-2">
            <Switch /> Voice guidance
          </label>
        </div>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="week" className="w-full">
          <TabsList>
            <TabsTrigger value="week">This week</TabsTrigger>
            <TabsTrigger value="month">This month</TabsTrigger>
            <TabsTrigger value="year">This year</TabsTrigger>
          </TabsList>
          <TabsContent value="week" className="p-4">
            Weekly levels
          </TabsContent>
          <TabsContent value="month" className="p-4">
            Monthly levels
          </TabsContent>
          <TabsContent value="year" className="p-4">
            Yearly levels
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Dialog, sheet, menu, tooltip, toast">
        <Row>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="touch">
                Open dialog
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Well details</DialogTitle>
              <DialogDescription>Borewell #4 — Kharagpur</DialogDescription>
              <p>Depth 42 m. Water level 11.3 m below ground level.</p>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="touch">
                Open bottom sheet
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto">
              <SheetTitle>Filter wells</SheetTitle>
              <p className="p-4">Pick a village, depth range or status.</p>
            </SheetContent>
          </Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="touch">
                Report menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Download PDF</DropdownMenuItem>
              <DropdownMenuItem>Share link</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="touch">
                  Depth
                </Button>
              </TooltipTrigger>
              <TooltipContent>Metres below ground level</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button size="touch" onClick={() => toast("Level saved", { description: "11.3 m bgl" })}>
            Show toast
          </Button>
        </Row>
        <Toaster />
      </Section>

      <Section title="Status pills" description="Icon + text + colour, never colour alone.">
        <Row>
          <StatusPill status="good" label="Water level good" />
          <StatusPill status="warning" label="Falling fast" />
          <StatusPill status="critical" label="Nearly dry" />
          <StatusPill status="offline" label="Sensor offline" />
        </Row>
      </Section>

      <Section title="Trend arrows">
        <Row>
          <TrendArrow direction="rising" label="Rising vs last week" delta={0.4} />
          <TrendArrow direction="falling" label="Falling vs last week" delta={-1.2} />
          <TrendArrow direction="steady" label="Steady vs last week" />
        </Row>
      </Section>

      <Section title="Water gauge">
        <Row>
          <WaterGauge
            value={11.3}
            min={0}
            max={40}
            thresholds={[
              { value: 25, status: "critical" },
              { value: 15, status: "warning" },
              { value: 5, status: "good" },
            ]}
            name="Well #4"
            valueText="11.3 metres below ground level"
            centerLabel="11.3"
            unitLabel="m bgl"
          />
          <WaterGauge
            value={28}
            min={0}
            max={40}
            name="Borewell #9"
            valueText="28 m"
            centerLabel="28"
          />
          <WaterGauge
            value={0}
            min={0}
            max={40}
            name="Borewell #12"
            valueText="0 m — dry"
            centerLabel="0"
          />
        </Row>
      </Section>

      <Section title="Well tank">
        <Row>
          <WellTank fillRatio={0.75} status="good" name="Well #4" valueText="Three quarters full" />
          <WellTank
            fillRatio={0.35}
            status="warning"
            name="Borewell #9"
            valueText="One third full"
          />
          <WellTank fillRatio={0.1} status="critical" name="Borewell #12" valueText="Nearly dry" />
          <WellTank fillRatio={0} status="offline" name="Borewell #15" valueText="No data" />
        </Row>
      </Section>

      <Section title="Stat tiles">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatTile
            label="Water level"
            value="11.3"
            unit="m bgl"
            trend="rising"
            trendLabel="Rising"
            status="good"
            statusLabel="Good"
          />
          <StatTile label="Depth" value="42" unit="m" />
        </div>
      </Section>

      <Section title="States">
        <div className="grid gap-4">
          <EmptyState
            title="No wells yet"
            description="Add your first well to see water levels here."
            action={{ label: "Add well", onClick: () => undefined }}
          />
          <ErrorState
            title="Could not load level"
            description="Check your internet connection."
            action={{ label: "Try again", onClick: () => undefined }}
          />
          <LoadingState label="Loading water level" />
        </div>
      </Section>
    </div>
  );
}
