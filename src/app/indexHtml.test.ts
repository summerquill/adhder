import { describe, expect, it } from "vitest";

import indexHtml from "../../index.html?raw";

describe("index.html", () => {
  it("shows an actionable fallback when the Vite entry cannot load", () => {
    expect(indexHtml).toContain("ADHDer 正在加载");
    expect(indexHtml).toContain("npm run dev");
    expect(indexHtml).toContain("http://localhost:4173/");
  });

  it("surfaces a visible message instead of a blank page when mounting fails", () => {
    expect(indexHtml).toContain('id="boot-error"');
    expect(indexHtml).toContain(".app-shell");
    expect(indexHtml).toContain("ADHDer 没有成功加载");
    expect(indexHtml).toContain("unhandledrejection");
  });
});
