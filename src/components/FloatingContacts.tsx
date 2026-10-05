"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Mail, MessageSquare, X } from "lucide-react";
import { ChatPopup } from "@/components/ChatPopup";
import { SketchCircle } from "@/components/SketchCircle";

const WHATSAPP_NUMBER = "6281234567890";
const WHATSAPP_MESSAGE = "Halo! Saya lihat portfolio kamu dan ingin ngobrol.";
const EMAIL = "hellolilstarry@gmail.com";
const EMAIL_SUBJECT = "Halo dari portfolio kamu";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.987 2.896 9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.884 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.688 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413" />
    </svg>
  );
}

type Contact = {
  key: string;
  note: string;
  href?: string;
  internal?: boolean;
  action?: "chat";
  ink: string;
  tilt: number;
  live?: boolean;
  icon: React.ReactNode;
};

const contacts: Contact[] = [
  {
    key: "chat",
    note: "live chat!",
    href: "/chat",
    internal: true,
    action: "chat",
    ink: "#e05c4a",
    tilt: -6,
    live: true,
    icon: <MessageSquare size={19} strokeWidth={2.2} />,
  },
  {
    key: "whatsapp",
    note: "wa me ~",
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`,
    ink: "#25D366",
    tilt: 5,
    icon: <WhatsAppIcon />,
  },
  {
    key: "email",
    note: "drop a mail",
    href: `mailto:${EMAIL}?subject=${encodeURIComponent(EMAIL_SUBJECT)}`,
    ink: "var(--blue-color)",
    tilt: -3,
    icon: <Mail size={19} strokeWidth={2.2} />,
  },
];

export function FloatingContacts() {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const isChatRoute = pathname === "/chat";

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isChatRoute) setOpen(false);
  }, [isChatRoute]);

  const closeChat = () => {
    setOpen(false);
    launcherRef.current?.focus();
  };

  return (
    <>
      {!isChatRoute && <ChatPopup open={open} onClose={closeChat} />}

      <div className="fixed z-50 flex flex-col gap-3 right-4 top-auto bottom-16 items-end sm:right-8">
        <div
          className="hidden lg:flex flex-col items-end pr-1 pointer-events-none"
          style={{
            opacity: mounted ? 0.75 : 0,
            transition: "opacity 0.4s ease 0.1s",
          }}
        >
          <span className="font-caveat text-[1.05rem] font-semibold text-muted -rotate-7">
            let's talk!
          </span>
          <svg width="34" height="26" viewBox="0 0 34 26" fill="none" aria-hidden="true">
            <path
              d="M6 2c9 1 15 6 16 14"
              stroke="var(--muted-color)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray="0.1 4.5"
            />
            <path
              d="M17 12l5 5 5-5"
              stroke="var(--muted-color)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="translate(0 1)"
            />
          </svg>
        </div>

        {contacts.map((item, i) => {
          const isHovered = hovered === item.key;
          const isChatToggle = item.action === "chat" && !isChatRoute;
          const isOpen = isChatToggle && open;
          const isActive = isHovered || isOpen;

          const inner = (
            <>
              <SketchCircle ink={item.ink} />
              <span className="relative" style={{ color: item.ink }}>
                {isOpen ? <X size={19} strokeWidth={2.4} /> : item.icon}
              </span>
              {item.live && (
                <span className="absolute h-2 w-2 animate-pulse rounded-full top-0.5 right-0.5 bg-green border-[1.5px] border-background" />
              )}
            </>
          );

          const style: React.CSSProperties = {
            transform: isActive ? "rotate(0deg) scale(1.12)" : `rotate(${item.tilt}deg) scale(1)`,
            transition: "transform 0.2s ease",
          };
          const className =
            "relative flex items-center justify-center pointer-events-auto w-9 h-9 sm:w-10.5 sm:h-10.5";
          const handlers = {
            onMouseEnter: () => setHovered(item.key),
            onMouseLeave: () => setHovered(null),
            "aria-label": item.key,
          };

          return (
            <div
              key={item.key}
              className="flex items-center gap-2 pointer-events-none"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(14px)",
                transition: `opacity 0.35s ease ${i * 90}ms, transform 0.35s ease ${i * 90}ms`,
              }}
            >
              <div
                className="sketch relative hidden md:block pt-0.75 pb-1 px-2.25 pointer-events-none"
                style={{
                  // @ts-expect-error -- custom property dipakai oleh .sketch
                  "--frame": item.ink,
                  "--frame-fill": "var(--bg-color)",
                  opacity: isActive ? 1 : 0,
                  transform: isActive
                    ? "rotate(-2deg) translateX(0)"
                    : "rotate(-2deg) translateX(8px)",
                  transition: "all 0.2s ease",
                }}
              >
                <svg className="frame" preserveAspectRatio="none" aria-hidden="true">
                  <rect
                    x="3"
                    y="3"
                    style={{ width: "calc(100% - 6px)", height: "calc(100% - 6px)" }}
                    strokeWidth="1.6"
                    strokeDasharray="8 3 5 2 9 4"
                    strokeLinecap="round"
                    rx="3"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle cx="6" cy="6" r="1.5" opacity="0.4" />
                  <circle cy="6" r="1.5" style={{ cx: "calc(100% - 6px)" }} opacity="0.4" />
                  <circle cx="6" r="1.5" style={{ cy: "calc(100% - 6px)" }} opacity="0.4" />
                  <circle
                    r="1.5"
                    style={{ cx: "calc(100% - 6px)", cy: "calc(100% - 6px)" }}
                    opacity="0.4"
                  />
                </svg>
                <span
                  className="inner font-caveat text-[1rem] font-semibold whitespace-nowrap text-foreground"
                  style={{
                    lineHeight: 1.3,
                  }}
                >
                  {isOpen ? "close" : item.note}
                </span>
              </div>

              {isChatToggle ? (
                <button
                  type="button"
                  ref={launcherRef}
                  onClick={() => setOpen((o) => !o)}
                  aria-expanded={open}
                  aria-haspopup="dialog"
                  aria-controls="chat-popup"
                  className={className}
                  style={{
                    ...style,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                  {...handlers}
                  aria-label={open ? "close chat" : "open chat"}
                >
                  {inner}
                </button>
              ) : item.internal ? (
                <Link href={item.href!} className={className} style={style} {...handlers}>
                  {inner}
                </Link>
              ) : (
                <a
                  href={item.href!}
                  target={item.href!.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className={className}
                  style={style}
                  {...handlers}
                >
                  {inner}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
