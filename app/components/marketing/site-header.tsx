"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navigation = [
  { href: "/about", label: "About" },
  { href: "/piani", label: "Piani" },
  { href: "/faq", label: "Faq" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[84px] max-w-[1240px] items-center justify-between px-6 sm:px-12">
        <Link href="/" aria-label="LOCO, vai alla Home" className="flex shrink-0 items-center" onClick={() => setOpen(false)}>
          {/* The artwork is cropped from the original user-supplied home.svg. */}
          <img src="/marketing/loco-logo.webp" alt="LOCO" className="h-[46px] w-auto object-contain" width="117" height="48" />
        </Link>
        <nav aria-label="Navigazione principale" className="hidden items-center gap-9 md:flex">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}
              className={`text-[17px] font-semibold transition-colors hover:text-loco-purple ${pathname === item.href ? "text-loco-purple font-bold" : "text-[#181818]"}`}>
              {item.label}
            </Link>
          ))}
          <Link href="/app" className="loco-button loco-button-purple !px-8 !py-[9px] text-[15px]">Login</Link>
        </nav>
        <button type="button" aria-label={open ? "Chiudi menu" : "Apri menu"} aria-controls="loco-mobile-menu" aria-expanded={open}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-black/10 md:hidden" onClick={() => setOpen((value) => !value)}>
          {open ? <X aria-hidden size={23} /> : <Menu aria-hidden size={23} />}
        </button>
      </div>
      {open && (
        <nav id="loco-mobile-menu" aria-label="Navigazione mobile" className="border-t border-black/10 bg-white px-6 pb-6 pt-3 md:hidden">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}
              onClick={() => setOpen(false)} className={`block rounded-xl px-4 py-3 text-base font-semibold ${pathname === item.href ? "bg-loco-lavender/30 text-loco-purple font-bold" : "text-[#181818]"}`}>
              {item.label}
            </Link>
          ))}
          <Link href="/app" onClick={() => setOpen(false)} className="loco-button loco-button-purple mt-4 block text-center">Login</Link>
        </nav>
      )}
    </header>
  );
}
