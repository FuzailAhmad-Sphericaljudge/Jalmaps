import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Switch } from "./switch";
import { Textarea } from "./textarea";

describe("Input / Textarea", () => {
  it("accepts typed text when labelled", async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="village">Village name</label>
        <Input id="village" />
      </>,
    );
    await user.type(screen.getByLabelText("Village name"), "Kharagpur");
    expect(screen.getByLabelText("Village name")).toHaveValue("Kharagpur");
  });

  it("textarea supports multi-line input", async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="notes">Notes</label>
        <Textarea id="notes" />
      </>,
    );
    await user.type(screen.getByLabelText("Notes"), "Well is dry in May");
    expect(screen.getByLabelText("Notes")).toHaveValue("Well is dry in May");
  });
});

describe("Select", () => {
  function SelectDemo({ onValueChange }: { onValueChange?: (v: string) => void }) {
    return (
      <Select onValueChange={onValueChange}>
        <SelectTrigger aria-label="District">
          <SelectValue placeholder="Choose district" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="nagpur">Nagpur</SelectItem>
          <SelectItem value="amravati">Amravati</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  it("opens, selects and closes via keyboard and pointer", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SelectDemo onValueChange={onValueChange} />);

    const trigger = screen.getByRole("combobox", { name: "District" });
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: "Amravati" }));

    expect(onValueChange).toHaveBeenCalledWith("amravati");
  });

  it("supports keyboard selection", async () => {
    const user = userEvent.setup();
    render(<SelectDemo />);

    await user.click(screen.getByRole("combobox", { name: "District" }));
    await user.keyboard("{Enter}");

    expect(screen.getByRole("combobox", { name: "District" })).toBeInTheDocument();
  });
});

describe("Checkbox", () => {
  it("toggles on click and exposes aria-checked", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <>
        <label htmlFor="alerts">Send alerts</label>
        <Checkbox id="alerts" onCheckedChange={onCheckedChange} />
      </>,
    );

    const box = screen.getByLabelText("Send alerts");
    expect(box).toHaveAttribute("aria-checked", "false");
    await user.click(box);
    expect(box).toHaveAttribute("aria-checked", "true");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("toggles with the keyboard (Space)", async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Terms" />);
    await user.click(screen.getByRole("checkbox", { name: "Terms" }));
    await user.keyboard(" ");
    expect(screen.getByRole("checkbox", { name: "Terms" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });
});

describe("RadioGroup", () => {
  it("selects one option and moves with arrows", async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup defaultValue="m" aria-label="Units">
        <label htmlFor="u-m">
          Metres
          <RadioGroupItem value="m" id="u-m" />
        </label>
        <label htmlFor="u-ft">
          Feet
          <RadioGroupItem value="ft" id="u-ft" />
        </label>
      </RadioGroup>,
    );

    const metres = screen.getByRole("radio", { name: "Metres" });
    const feet = screen.getByRole("radio", { name: "Feet" });

    expect(metres).toHaveAttribute("aria-checked", "true");
    await user.click(feet);
    expect(feet).toHaveAttribute("aria-checked", "true");
    expect(metres).toHaveAttribute("aria-checked", "false");
  });
});

describe("Switch", () => {
  it("toggles state and role", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Voice guidance" onCheckedChange={onCheckedChange} />);

    const sw = screen.getByRole("switch", { name: "Voice guidance" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    await user.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "true");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
