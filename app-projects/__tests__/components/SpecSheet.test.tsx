import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SpecSheet from "@/components/mdx/SpecSheet";

describe("<SpecSheet>", () => {
  it("renders a semantic description list of key/value specs", () => {
    const { container } = render(
      <SpecSheet
        title="Pull Parameters"
        specs={[
          { label: "Dose", value: "18 g in" },
          { label: "Yield", value: "36 g out" },
        ]}
      />
    );

    expect(screen.getByText("Pull Parameters")).toBeInTheDocument();

    // Semantic <dl>/<dt>/<dd> structure (not asserting Tailwind classes).
    expect(container.querySelector("dl")).toBeInTheDocument();
    const terms = Array.from(container.querySelectorAll("dt")).map((n) => n.textContent);
    const defs = Array.from(container.querySelectorAll("dd")).map((n) => n.textContent);
    expect(terms).toEqual(["Dose", "Yield"]);
    expect(defs).toEqual(["18 g in", "36 g out"]);
  });
});
