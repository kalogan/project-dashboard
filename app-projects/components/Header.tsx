import Link from "next/link";

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
        <ul className="flex gap-8 font-normal">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-gray-400 transition-colors hover:text-white"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
