"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/piani", label: "Piani" },
  { href: "/faq", label: "Faq" },
  { href: "/demo", label: "Demo" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between gap-5 px-6 sm:px-10 lg:px-14">
        <Link href="/" aria-label="LOCO, vai alla Home" className="flex shrink-0 items-center" onClick={() => setOpen(false)}>
          {/* The artwork is cropped from the original user-supplied home.svg. */}
          <img src="/marketing/loco-logo.webp" alt="LOCO" className="h-[42px] w-auto object-contain" width="117" height="48" />
        </Link>
        <nav aria-label="Navigazione principale" className="hidden items-center gap-3 md:flex">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-[14px] font-medium transition-colors hover:bg-loco-lavender/30 ${pathname === item.href ? "font-bold text-loco-purple" : "text-[#181818]"}`}>
              {item.label}
            </Link>
          ))}
          <Link href="/app" className="loco-button loco-button-purple ml-3 !px-7 !py-[11px]">Area LOCO</Link>
        </nav>
        <button type="button" aria-label={open ? "Chiudi menu" : "Apri menu"} aria-controls="loco-mobile-menu" aria-expanded={open}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-black/10 md:hidden" onClick={() => setOpen((value) => !value)}>
          {open ? <X aria-hidden size={23} /> : <Menu aria-hidden size={23} />}
        </button>
      </div>
      {open && (
        <nav id="loco-mobile-menu" aria-label="Navigazione mobile" className="border-t border-black/10 bg-white px-6 pb-5 pt-3 md:hidden">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}
              onClick={() => setOpen(false)} className={`block rounded-xl px-3 py-3.5 text-base ${pathname === item.href ? "bg-loco-lavender/30 font-bold text-loco-purple" : "font-semibold"}`}>
              {item.label}
            </Link>
          ))}
          <Link href="/app" onClick={() => setOpen(false)} className="loco-button loco-button-purple mt-3 block text-center">Entra in LOCO</Link>
        </nav>
      )}
    </header>
  );
}
