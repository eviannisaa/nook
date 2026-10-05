"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";

export interface ChatPopupProps {
  open: boolean;
  onClose: () => void;
}

const EDGE = 8;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export function ChatPopup({ open, onClose }: ChatPopupProps) {
  const [everOpened, setEverOpened] = useState(false);
  useEffect(() => {
    if (open) setEverOpened(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ── drag ──────────────────────────────────────────────────────────────────
  const shellRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const gestureRef = useRef<{
    startX: number;
    startY: number;
    fromX: number;
    fromY: number;
    minDX: number;
    maxDX: number;
    minDY: number;
    maxDY: number;
  } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("button")) return;
      const el = shellRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      gestureRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        fromX: offset.x,
        fromY: offset.y,
        minDX: EDGE - r.left,
        maxDX: window.innerWidth - EDGE - r.right,
        minDY: EDGE - r.top,
        maxDY: window.innerHeight - EDGE - r.bottom,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
    },
    [offset.x, offset.y],
  );

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (!g) return;
    setOffset({
      x: g.fromX + clamp(e.clientX - g.startX, g.minDX, g.maxDX),
      y: g.fromY + clamp(e.clientY - g.startY, g.minDY, g.maxDY),
    });
  }, []);

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!gestureRef.current) return;
    gestureRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setDragging(false);
  }, []);

  useEffect(() => {
    const onResize = () => {
      const el = shellRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = clamp(
        0,
        EDGE - r.left,
        Math.max(EDGE - r.left, window.innerWidth - EDGE - r.right),
      );
      const dy = clamp(
        0,
        EDGE - r.top,
        Math.max(EDGE - r.top, window.innerHeight - EDGE - r.bottom),
      );
      if (dx || dy) setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!everOpened) return null;

  return (
    <div
      ref={shellRef}
      id="chat-popup"
      role="dialog"
      aria-label="live chat with dev_assistant"
      inert={!open}
      // className="fixed z-20 min-h-65 bottom-40 right-15 sm:right-22 w-[min(240px,calc(100vw-3rem))] h-[min(360px,calc(100dvh-92px))] sm:w-[min(380px,calc(100vw-3rem))] md:h-[min(420px,calc(100dvh-92px))] md:right-[8.3rem]"
      className="fixed z-60 min-h-65 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[min(360px,calc(100dvh-92px))] sm:top-auto sm:left-auto sm:bottom-16 sm:right-22 sm:w-[min(380px,calc(100vw-3rem))] sm:translate-y-0 sm:translate-x-0  md:h-[min(420px,calc(100dvh-92px))] md:right-[8.3rem]"

      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: dragging ? "none" : "transform 0.18s ease",
        pointerEvents: open ? "auto" : "none",
      }}
    >
      {/* top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] */}
      <div
        className="chat-popup h-full"
        style={{
          transformOrigin: "bottom right",
          opacity: open ? 1 : 0,
          transform: open
            ? "translateY(0) scale(1) rotate(0deg)"
            : "translateY(10px) scale(0.94) rotate(1.5deg)",
          visibility: open ? "visible" : "hidden",
          pointerEvents: open ? "auto" : "none",
          transition: open
            ? "opacity 0.18s ease-out, transform 0.26s cubic-bezier(0.34, 1.4, 0.5, 1), visibility 0s"
            : "opacity 0.14s ease-in, transform 0.16s ease-in, visibility 0s linear 0.16s",
        }}
      >
        <ChatPanel
          height="100%"
          variant="chatapp"
          suggestions="inside"
          active={open}
          onClose={onClose}
          dragHandleProps={{
            onPointerDown,
            onPointerMove,
            onPointerUp: endDrag,
            onPointerCancel: endDrag,
            onDoubleClick: () => setOffset({ x: 0, y: 0 }),
            title: "drag to move · double-click to snap back",
            style: {
              cursor: dragging ? "grabbing" : "grab",
              touchAction: "none",
              userSelect: "none",
            },
          }}
        />
      </div>
    </div>
  );
}

export default ChatPopup;
