// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TaskChatComposerDock } from "./TaskChatComposerDock";

let root: Root;
let container: HTMLDivElement;
let viewport: EventTarget & { height: number; offsetTop: number; scale: number };

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("innerHeight", 844);
  viewport = Object.assign(new EventTarget(), { height: 844, offsetTop: 0, scale: 1 });
  vi.stubGlobal("visualViewport", viewport);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

function render(mobile = true) {
  act(() => root.render(<TaskChatComposerDock mobile={mobile} streamlined>
    <textarea aria-label="Reply" />
  </TaskChatComposerDock>));
  return container.firstElementChild as HTMLElement;
}

it("positions the mobile dock above the visible keyboard, including Safari viewport panning", () => {
  const dock = render();
  act(() => container.querySelector("textarea")!.focus());
  act(() => {
    viewport.height = 400;
    viewport.offsetTop = 44;
    viewport.dispatchEvent(new Event("resize"));
  });
  expect(dock.style.getPropertyValue("--tc-keyboard-inset")).toBe("400px");
  expect(dock.dataset.keyboardOpen).toBe("true");
  act(() => {
    viewport.offsetTop = 64;
    viewport.dispatchEvent(new Event("scroll"));
  });
  expect(dock.style.getPropertyValue("--tc-keyboard-inset")).toBe("380px");
  act(() => {
    viewport.height = 844;
    viewport.offsetTop = 0;
    viewport.dispatchEvent(new Event("resize"));
  });
  expect(dock.dataset.keyboardOpen).not.toBe("true");
  expect(dock.style.getPropertyValue("--tc-keyboard-inset")).toBe("");
});

it("does not mistake zoom or browser chrome for the keyboard", () => {
  const dock = render();
  act(() => container.querySelector("textarea")!.focus());
  act(() => {
    viewport.height = 760;
    viewport.dispatchEvent(new Event("resize"));
  });
  expect(dock.dataset.keyboardOpen).not.toBe("true");
  act(() => {
    viewport.scale = 2;
    viewport.height = 400;
    viewport.dispatchEvent(new Event("resize"));
  });
  expect(dock.dataset.keyboardOpen).not.toBe("true");
});

it("does not reposition a desktop dock or an unfocused mobile dock", () => {
  const dock = render(false);
  act(() => container.querySelector("textarea")!.focus());
  act(() => {
    viewport.height = 400;
    viewport.dispatchEvent(new Event("resize"));
  });
  expect(dock.dataset.keyboardOpen).not.toBe("true");
  act(() => container.querySelector("textarea")!.blur());
  render(true);
  expect(dock.dataset.keyboardOpen).not.toBe("true");
});
