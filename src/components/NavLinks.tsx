"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Header links with the current section highlighted */
export default function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 text-sm font-bold">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-lg px-3 sm:min-h-9 ${
              active ? "bg-primary/10 text-primary dark:bg-primary-light/15 dark:text-primary-light" : "hover:bg-muted"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
