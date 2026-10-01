"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  { name: "primary", labelKey: "primary", className: "bg-primary" },
  { name: "success", labelKey: "success", className: "bg-success" },
  { name: "warning", labelKey: "warning", className: "bg-warning" },
  { name: "danger", labelKey: "danger", className: "bg-danger" },
  { name: "offline", labelKey: "offline", className: "bg-offline" },
] as const;

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
  const t = useTranslations("gallery");
  const tSections = useTranslations("gallery.sections");
  const tSwatches = useTranslations("gallery.swatches");
  const tType = useTranslations("gallery.typeScaleRows");
  const tButtons = useTranslations("gallery.buttons");
  const tBadges = useTranslations("gallery.badges");
  const tCards = useTranslations("gallery.cards");
  const tForms = useTranslations("gallery.forms");
  const tTabs = useTranslations("gallery.tabs");
  const tOverlays = useTranslations("gallery.overlays");
  const tPills = useTranslations("gallery.statusPills");
  const tTrends = useTranslations("gallery.trends");
  const tGauges = useTranslations("gallery.gauges");
  const tTanks = useTranslations("gallery.tanks");
  const tTiles = useTranslations("gallery.statTiles");
  const tStates = useTranslations("gallery.states");

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
          title={t("toolbar.toggleLargeText")}
        >
          <span aria-hidden className="text-base leading-none">
            {"A"}
          </span>
          <span aria-hidden className="text-sm leading-none">
            {"A"}
          </span>
          {t("toolbar.largeText")}
        </Button>
      </div>

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-foreground-muted">{t("description")}</p>
      </header>

      <Section title={tSections("brand")}>
        <Row>
          <LogoMark title="JalMaps" />
          <Wordmark />
        </Row>
      </Section>

      <Section title={tSections("colours")} description={tSections("coloursDescription")}>
        <Row>
          {STATUS_SWATCHES.map((swatch) => (
            <div key={swatch.name} className="flex flex-col items-center gap-1">
              <span
                aria-hidden
                className={`size-12 rounded-lg border border-border ${swatch.className}`}
              />
              <span className="text-xs text-foreground-muted">{tSwatches(swatch.labelKey)}</span>
            </div>
          ))}
        </Row>
      </Section>

      <Section title={tSections("typeScale")}>
        <div className="flex flex-col gap-1">
          <span className="text-xs">{tType("xs")}</span>
          <span className="text-sm">{tType("sm")}</span>
          <span className="text-base">{tType("base")}</span>
          <span className="text-lg">{tType("lg")}</span>
          <span className="text-xl">{tType("xl")}</span>
          <span className="text-2xl">{tType("xxl")}</span>
          <span className="text-3xl">{tType("xxxl")}</span>
        </div>
      </Section>

      <Section title={tSections("buttons")} description={tSections("buttonsDescription")}>
        <Row>
          <Button size="touch">{tButtons("primary")}</Button>
          <Button variant="outline" size="touch">
            {tButtons("outline")}
          </Button>
          <Button variant="secondary" size="touch">
            {tButtons("secondary")}
          </Button>
          <Button variant="ghost" size="touch">
            {tButtons("ghost")}
          </Button>
          <Button variant="destructive" size="touch">
            {tButtons("destructive")}
          </Button>
          <Button variant="link" size="touch">
            {tButtons("link")}
          </Button>
        </Row>
        <Row>
          <Button size="sm">{tButtons("small")}</Button>
          <Button size="lg">{tButtons("large")}</Button>
          <Button size="icon-touch" aria-label={tButtons("refreshLevels")}>
            {"↻"}
          </Button>
          <Button size="touch" disabled>
            {tButtons("disabled")}
          </Button>
        </Row>
      </Section>

      <Section title={tSections("badges")}>
        <Row>
          <Badge>{tBadges("default")}</Badge>
          <Badge variant="secondary">{tBadges("secondary")}</Badge>
          <Badge variant="outline">{tBadges("outline")}</Badge>
          <Badge variant="destructive">{tBadges("destructive")}</Badge>
        </Row>
        <Separator />
        <div className="flex flex-col gap-2">
          <Skeleton statusLabel={tBadges("loadingLevels")} className="h-6 w-64" />
          <LoadingSkeleton label={tBadges("loadingTile")} />
        </div>
      </Section>

      <Section title={tSections("cards")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{tCards("well4Title")}</CardTitle>
              <CardDescription>{tCards("well4Description")}</CardDescription>
            </CardHeader>
            <CardContent>{tCards("well4Value")}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{tCards("borewell9Title")}</CardTitle>
              <CardDescription>{tCards("borewell9Description")}</CardDescription>
            </CardHeader>
            <CardContent>{tCards("borewell9Value")}</CardContent>
          </Card>
        </div>
      </Section>

      <Section title={tSections("formControls")} description={tSections("formControlsDescription")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="g-village">{tForms("villageName")}</label>
            <Input id="g-village" placeholder={tForms("villagePlaceholder")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="g-notes">{tForms("notes")}</label>
            <Textarea id="g-notes" placeholder={tForms("notesPlaceholder")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="g-district">{tForms("district")}</label>
            <Select>
              <SelectTrigger id="g-district">
                <SelectValue placeholder={tForms("districtPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nagpur">{tForms("districtNagpur")}</SelectItem>
                <SelectItem value="amravati">{tForms("districtAmravati")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm">{tForms("alertsLegend")}</legend>
            <label className="flex items-center gap-2">
              <Checkbox /> {tForms("smsAlerts")}
            </label>
            <label className="flex items-center gap-2">
              <Checkbox defaultChecked /> {tForms("voiceCalls")}
            </label>
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm">{tForms("unitsLegend")}</legend>
            <RadioGroup defaultValue="m" className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <RadioGroupItem value="m" /> {tForms("metres")}
              </label>
              <label className="flex items-center gap-2">
                <RadioGroupItem value="ft" /> {tForms("feet")}
              </label>
            </RadioGroup>
          </fieldset>
          <label className="flex items-center gap-2">
            <Switch /> {tForms("voiceGuidance")}
          </label>
        </div>
      </Section>

      <Section title={tSections("tabs")}>
        <Tabs defaultValue="week" className="w-full">
          <TabsList>
            <TabsTrigger value="week">{tTabs("week")}</TabsTrigger>
            <TabsTrigger value="month">{tTabs("month")}</TabsTrigger>
            <TabsTrigger value="year">{tTabs("year")}</TabsTrigger>
          </TabsList>
          <TabsContent value="week" className="p-4">
            {tTabs("weekContent")}
          </TabsContent>
          <TabsContent value="month" className="p-4">
            {tTabs("monthContent")}
          </TabsContent>
          <TabsContent value="year" className="p-4">
            {tTabs("yearContent")}
          </TabsContent>
        </Tabs>
      </Section>

      <Section title={tSections("overlays")}>
        <Row>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="touch">
                {tOverlays("openDialog")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>{tOverlays("wellDetailsTitle")}</DialogTitle>
              <DialogDescription>{tOverlays("wellDetailsDescription")}</DialogDescription>
              <p>{tOverlays("wellDetailsBody")}</p>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="touch">
                {tOverlays("openSheet")}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto">
              <SheetTitle>{tOverlays("filterWellsTitle")}</SheetTitle>
              <p className="p-4">{tOverlays("filterWellsBody")}</p>
            </SheetContent>
          </Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="touch">
                {tOverlays("reportMenu")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>{tOverlays("downloadPdf")}</DropdownMenuItem>
              <DropdownMenuItem>{tOverlays("shareLink")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="touch">
                  {tOverlays("depth")}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{tOverlays("depthTooltip")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            size="touch"
            onClick={() =>
              toast(tOverlays("toastTitle"), { description: tOverlays("toastDescription") })
            }
          >
            {tOverlays("showToast")}
          </Button>
        </Row>
        <Toaster />
      </Section>

      <Section title={tSections("statusPills")} description={tSections("statusPillsDescription")}>
        <Row>
          <StatusPill status="good" label={tPills("good")} />
          <StatusPill status="warning" label={tPills("warning")} />
          <StatusPill status="critical" label={tPills("critical")} />
          <StatusPill status="offline" label={tPills("offline")} />
        </Row>
      </Section>

      <Section title={tSections("trendArrows")}>
        <Row>
          <TrendArrow direction="rising" label={tTrends("rising")} delta={0.4} />
          <TrendArrow direction="falling" label={tTrends("falling")} delta={-1.2} />
          <TrendArrow direction="steady" label={tTrends("steady")} />
        </Row>
      </Section>

      <Section title={tSections("waterGauge")}>
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
            name={tGauges("well4Name")}
            valueText={tGauges("well4ValueText")}
            centerLabel={tGauges("well4Center")}
            unitLabel={tGauges("well4Unit")}
          />
          <WaterGauge
            value={28}
            min={0}
            max={40}
            name={tGauges("borewell9Name")}
            valueText={tGauges("borewell9ValueText")}
            centerLabel={tGauges("borewell9Center")}
          />
          <WaterGauge
            value={0}
            min={0}
            max={40}
            name={tGauges("borewell12Name")}
            valueText={tGauges("borewell12ValueText")}
            centerLabel={tGauges("borewell12Center")}
          />
        </Row>
      </Section>

      <Section title={tSections("wellTank")}>
        <Row>
          <WellTank
            fillRatio={0.75}
            status="good"
            name={tTanks("well4Name")}
            valueText={tTanks("well4ValueText")}
          />
          <WellTank
            fillRatio={0.35}
            status="warning"
            name={tTanks("borewell9Name")}
            valueText={tTanks("borewell9ValueText")}
          />
          <WellTank
            fillRatio={0.1}
            status="critical"
            name={tTanks("borewell12Name")}
            valueText={tTanks("borewell12ValueText")}
          />
          <WellTank
            fillRatio={0}
            status="offline"
            name={tTanks("borewell15Name")}
            valueText={tTanks("borewell15ValueText")}
          />
        </Row>
      </Section>

      <Section title={tSections("statTiles")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatTile
            label={tTiles("waterLevel")}
            value={tTiles("waterLevelValue")}
            unit={tTiles("waterLevelUnit")}
            trend="rising"
            trendLabel={tTiles("waterLevelTrend")}
            status="good"
            statusLabel={tTiles("waterLevelStatus")}
          />
          <StatTile
            label={tTiles("depth")}
            value={tTiles("depthValue")}
            unit={tTiles("depthUnit")}
          />
        </div>
      </Section>

      <Section title={tSections("states")}>
        <div className="grid gap-4">
          <EmptyState
            title={tStates("emptyTitle")}
            description={tStates("emptyDescription")}
            action={{ label: tStates("emptyAction"), onClick: () => undefined }}
          />
          <ErrorState
            title={tStates("errorTitle")}
            description={tStates("errorDescription")}
            action={{ label: tStates("errorAction"), onClick: () => undefined }}
          />
          <LoadingState label={tStates("loadingLabel")} />
        </div>
      </Section>
    </div>
  );
}
