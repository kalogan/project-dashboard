import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * The Logbook is the private timeline. Even though it is excluded from the
 * search index, we belt-and-suspenders it here: an explicit `noindex, nofollow`
 * ensures search engines never scrape these pages if a URL ever leaks.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function LogbookLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
