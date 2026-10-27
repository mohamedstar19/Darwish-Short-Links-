"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Pause, Play } from "lucide-react";

/**
 * Decorative "network of links" behind every page: dots drift and link up
 * when close, lean toward the pointer, and a tap on empty space sends a ripple.
 * Data pages (dashboard, stats, admin) get a calmer version: fewer, fainter dots.
 *
 * Motion rules: a visible pause control (WCAG 2.2.2), a still frame for
 * prefers-reduced-motion, no work while the tab is hidden, and cleanup on unmount.
 */
export default function AnimatedBackground() {
  const pathname = usePathname();
  const calm = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  return <LinkField calm={calm} />;
}

const STORAGE_KEY = "bg-motion";

function subscribeReducedMotion(onChange: () => void) {
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// The pause choice lives in localStorage; read it as an external store so the
// server render (always "playing") and the first client render agree.
const PAUSE_EVENT = "bg-motion-change";
function subscribePaused(onChange: () => void) {
  window.addEventListener(PAUSE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(PAUSE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
let memoryPaused = false; // fallback when storage is blocked (private mode)
function readPaused() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "off";
  } catch {
    return memoryPaused;
  }
}

type Node = { x: number; y: number; vx: number; vy: number; r: number; gold: boolean };
type Ripple = { x: number; y: number; age: number; pushed: Set<Node> };

const LINK_DISTANCE = 130;
const POINTER_RADIUS = 170;
const RIPPLE_MS = 900;
const RIPPLE_MAX = 240;

function rgb(hex: string) {
  const h = hex.trim().replace("#", "");
  const n = parseInt(h.length === 3 ? [...h].map((c) => c + c).join("") : h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function LinkField({ calm }: { calm: boolean }) {
  const t = useTranslations("background");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
  const paused = useSyncExternalStore(subscribePaused, readPaused, () => false);
  const still = reduced || paused;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    const ripples: Ripple[] = [];
    const pointer = { x: 0, y: 0, active: false };
    let colors = { line: "0,0,0", gold: "0,0,0", lineAlpha: 0.2 };
    let frame = 0;
    let last = performance.now();

    const readColors = () => {
      const css = getComputedStyle(document.documentElement);
      const dark = document.documentElement.classList.contains("dark");
      colors = {
        line: rgb(css.getPropertyValue("--primary-light") || "#12775b"),
        gold: rgb(css.getPropertyValue("--gold") || "#c19a3d"),
        lineAlpha: (dark ? 0.4 : 0.3) * (calm ? 0.75 : 1),
      };
    };

    const makeNode = (): Node => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.012 + Math.random() * 0.018; // px per ms
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1.6 + Math.random() * 1.6,
        gold: Math.random() < 0.18,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const dense = Math.max(34, Math.min(80, Math.round((width * height) / 13000)));
      const target = calm ? Math.round(dense * 0.75) : dense;
      while (nodes.length < target) nodes.push(makeNode());
      nodes = nodes.slice(0, target);
      for (const n of nodes) {
        n.x = Math.min(n.x, width);
        n.y = Math.min(n.y, height);
      }
    };

    const step = (dt: number) => {
      for (const n of nodes) {
        // Lean toward the pointer, clamped so dots never snap onto it
        if (pointer.active) {
          const dx = pointer.x - n.x;
          const dy = pointer.y - n.y;
          const d = Math.hypot(dx, dy);
          if (d < POINTER_RADIUS && d > 1) {
            const pull = (1 - d / POINTER_RADIUS) * 0.00004 * dt;
            n.vx += (dx / d) * pull;
            n.vy += (dy / d) * pull;
          }
        }
        // Ease back toward a calm drift speed
        const speed = Math.hypot(n.vx, n.vy);
        const calm = 0.02;
        if (speed > calm) {
          const k = 1 - Math.min(0.02 * (dt / 16), 0.5);
          n.vx *= k;
          n.vy *= k;
        }
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < -20) n.x = width + 20;
        else if (n.x > width + 20) n.x = -20;
        if (n.y < -20) n.y = height + 20;
        else if (n.y > height + 20) n.y = -20;
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.age += dt;
        const radius = (rp.age / RIPPLE_MS) * RIPPLE_MAX;
        for (const n of nodes) {
          if (rp.pushed.has(n)) continue;
          const d = Math.hypot(n.x - rp.x, n.y - rp.y);
          if (d < radius && d > 1) {
            n.vx += ((n.x - rp.x) / d) * 0.09;
            n.vy += ((n.y - rp.y) / d) * 0.09;
            rp.pushed.add(n);
          }
        }
        if (rp.age > RIPPLE_MS) ripples.splice(i, 1);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK_DISTANCE) {
            ctx.strokeStyle = `rgba(${colors.line}, ${(1 - d / LINK_DISTANCE) * colors.lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      if (pointer.active) {
        ctx.lineWidth = 1.25;
        for (const n of nodes) {
          const d = Math.hypot(pointer.x - n.x, pointer.y - n.y);
          if (d < POINTER_RADIUS) {
            ctx.strokeStyle = `rgba(${colors.gold}, ${(1 - d / POINTER_RADIUS) * (calm ? 0.35 : 0.55)})`;
            ctx.beginPath();
            ctx.moveTo(pointer.x, pointer.y);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.fillStyle = n.gold ? `rgba(${colors.gold}, 0.85)` : `rgba(${colors.line}, 0.6)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const rp of ripples) {
        const p = rp.age / RIPPLE_MS;
        ctx.strokeStyle = `rgba(${colors.gold}, ${0.5 * (1 - p)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, p * RIPPLE_MAX, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      step(dt);
      draw();
      frame = requestAnimationFrame(loop);
    };

    readColors();
    resize();

    // Repaint with the right colors when the theme changes
    const themeObserver = new MutationObserver(() => {
      readColors();
      if (still) draw();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const onResize = () => {
      resize();
      if (still) draw();
    };
    window.addEventListener("resize", onResize);

    if (still) {
      draw();
      return () => {
        themeObserver.disconnect();
        window.removeEventListener("resize", onResize);
      };
    }

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") pointer.active = false;
    };
    const onDown = (e: PointerEvent) => {
      // Taps on controls are for the controls, not the background
      if ((e.target as Element).closest?.("a, button, input, label, select, textarea, summary, [role=button]")) return;
      ripples.push({ x: e.clientX, y: e.clientY, age: 0, pushed: new Set() });
      if (ripples.length > 4) ripples.shift();
    };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(loop);
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      themeObserver.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [still, calm]);

  function toggle() {
    try {
      localStorage.setItem(STORAGE_KEY, paused ? "on" : "off");
    } catch {
      memoryPaused = !paused;
    }
    window.dispatchEvent(new Event(PAUSE_EVENT));
  }

  return (
    <>
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      {!reduced && (
        <button
          type="button"
          onClick={toggle}
          aria-label={paused ? t("play") : t("pause")}
          title={paused ? t("play") : t("pause")}
          className="fixed bottom-4 end-4 z-30 grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-input bg-card/90 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground"
        >
          {paused ? <Play size={18} aria-hidden /> : <Pause size={18} aria-hidden />}
        </button>
      )}
    </>
  );
}
