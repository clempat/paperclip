import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { isKeyboardShortcutTextInputTarget } from "@/lib/keyboardShortcuts";

interface TaskChatComposerDockProps {
  children: ReactNode;
  mobile: boolean;
  streamlined: boolean;
  concealed?: boolean;
}

/** The task thread and its Storybook phone previews share the same composer spacing. */
export function TaskChatComposerDock({ children, mobile, streamlined, concealed = false }: TaskChatComposerDockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [keyboard, setKeyboard] = useState<{ inset: number; height: number } | null>(null);
  useLayoutEffect(() => {
    const dock = ref.current;
    const viewport = window.visualViewport;
    if (!mobile || !dock || !viewport) {
      setKeyboard(null);
      return;
    }
    const update = () => {
      const editing = dock.contains(document.activeElement) &&
        isKeyboardShortcutTextInputTarget(document.activeElement);
      // Browser chrome changes and pinch zoom also shrink visualViewport. Only
      // a substantial, unzoomed reduction during editing is a software keyboard.
      const constrained = viewport.scale === 1 && Number.isFinite(viewport.height) &&
        viewport.height > 0 && Number.isFinite(viewport.offsetTop) &&
        window.innerHeight - viewport.height > 120;
      setKeyboard((previous) => {
        // Keep the dock steady through blur until the keyboard actually closes.
        if (!constrained || (!editing && !previous)) return null;
        const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
        return previous?.inset === inset && previous.height === viewport.height
          ? previous : { inset, height: viewport.height };
      });
    };
    update();
    dock.addEventListener("focusin", update);
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      dock.removeEventListener("focusin", update);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [mobile]);

  return <div
    ref={ref}
    data-testid="task-chat-composer-dock"
    data-keyboard-open={keyboard ? "true" : undefined}
    style={keyboard ? {
      "--tc-keyboard-inset": `${keyboard.inset}px`,
      "--tc-keyboard-viewport-height": `${keyboard.height}px`,
    } as CSSProperties : undefined}
    data-conversation-typography=""
    inert={concealed}
    aria-hidden={concealed || undefined}
    className={cn(
      "sticky flex max-w-(--tc-shell-max-w) flex-col gap-2",
      concealed && "invisible",
      mobile
        ? cn(
            "mobile-nav-composer bottom-(--tc-composer-bottom) z-20 w-auto px-1 pb-1",
            streamlined ? "-mx-2" : "mx-2",
          )
        : "bottom-0 z-10 mx-auto w-full px-1 pb-1 md:px-4 md:pb-2",
      streamlined && "md:px-0 md:pb-0",
      (!streamlined || mobile) &&
        "bg-background/80 pt-1 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-transparent dark:backdrop-blur-none dark:supports-[backdrop-filter]:bg-transparent",
    )}
  >
    {children}
  </div>;
}
