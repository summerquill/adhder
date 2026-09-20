import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

// 样式回归守卫：这里只验证结构性的布局约束，避免用浏览器渲染做断言。
const globals = readFileSync("src/styles/globals.css", "utf8");

function ruleFor(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) return "";

  const end = css.indexOf("}", start);
  return css.slice(start, end);
}

describe("globals.css", () => {
  it("lets the care panel scroll instead of clipping the comfort list", () => {
    expect(ruleFor(globals, ".care-panel")).toContain("overflow-y: auto");
    expect(ruleFor(globals, ".care-page")).toContain("display: grid");
  });

  it("wraps the section head on narrow screens", () => {
    expect(ruleFor(globals, ".section-head,\n.mini-head")).toContain("flex-wrap: wrap");
  });

  it("stacks the energy options safely on narrow screens", () => {
    const energyRow = ruleFor(globals, ".energy-row");
    const energyOptions = ruleFor(globals, ".energy-options");

    expect(energyRow).toContain("flex-wrap: wrap");
    expect(energyOptions).toContain("min-width: 190px");
  });
});
