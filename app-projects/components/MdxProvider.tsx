import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import PromptVault from "@/components/PromptVault";

/**
 * The Developer Codex MDX component map.
 *
 * Standard HTML elements are remapped to Tailwind-styled components that
 * enforce the monochrome design tokens, and custom components (PromptVault)
 * are exposed so they can be authored directly in markdown.
 *
 * Strictly grayscale: code blocks use a gray-900 surface with a gray-800
 * hairline; there is no syntax-highlighting theme, so no color can leak in.
 * Token differentiation, where it matters, comes from weight and italics only.
 */
function Anchor({
  href = "#",
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isInternal = href.startsWith("/");
  const className =
    "text-white underline-offset-4 transition-colors hover:underline";

  if (isInternal) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      {...rest}
    >
      {children}
    </a>
  );
}

export const mdxComponents = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="mt-12 mb-4 text-4xl font-extrabold tracking-tight text-white">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="mt-10 mb-3 text-2xl font-semibold tracking-tight text-white">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="mt-8 mb-2 text-xl font-semibold tracking-tight text-white">
      {children}
    </h3>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="my-4 font-normal leading-relaxed text-gray-300">{children}</p>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="my-4 ml-6 list-disc space-y-2 text-gray-300 marker:text-gray-600">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="my-4 ml-6 list-decimal space-y-2 text-gray-300 marker:text-gray-600">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }: { children?: ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="my-6 border-l-2 border-gray-700 pl-4 italic text-gray-400">
      {children}
    </blockquote>
  ),
  a: Anchor,
  // Clinical, monochrome code display.
  pre: ({ children }: { children?: ReactNode }) => (
    <pre className="my-6 overflow-x-auto border border-gray-800 bg-gray-900 p-4 font-mono text-sm leading-relaxed text-gray-300">
      {children}
    </pre>
  ),
  code: ({
    children,
    className,
  }: {
    children?: ReactNode;
    className?: string;
  }) => {
    // Fenced blocks arrive with a `language-*` class and are already framed by
    // <pre>; render them bare so the frame isn't doubled. Inline code (no
    // language class) gets its own subtle monochrome chip.
    if (className?.startsWith("language-")) {
      return <code className={className}>{children}</code>;
    }
    return (
      <code className="border border-gray-800 bg-gray-900 px-1.5 py-0.5 font-mono text-[0.85em] text-gray-200">
        {children}
      </code>
    );
  },
  hr: () => <hr className="my-10 border-gray-800" />,
  PromptVault,
};
