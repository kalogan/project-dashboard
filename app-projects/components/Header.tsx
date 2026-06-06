import Link from "next/link";
import SearchTrigger from "@/components/SearchTrigger";

/**
 * Global, minimalist navigation header.
 *
 * Crisp, unstyled typography — text links only, no icons or imagery. Visual
 * separation comes from a single hairline border and spacing, in keeping with
 * the strict monochrome design system.
 */
const NAV_LINKS = [
  { href: "/logbook", label: "Logbook" },
  { href: "/archive", label: "Archive" },
  { href: "/playbook", label: "Playbook" },
] as const;

export default function Header() {
  return (
    <header className="border-b border-gray-800">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-extrabold tracking-tight text-white">
          Developer Codex
        </Link>
        <div className="flex items-center gap-6 md:gap-8">
          <ul className="flex gap-6 font-normal md:gap-8">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-gray-400 transition-opacity duration-150 hover:opacity-70"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <SearchTrigger />
        </div>
      </nav>
    </header>
  );
}
