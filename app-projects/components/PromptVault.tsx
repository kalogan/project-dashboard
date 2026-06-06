import type { ReactNode } from "react";

/**
 * <PromptVault> — an expandable accordion for documenting lessons learned,
 * prompts, and architectural decisions inline within MDX.
 *
 * Built on the native <details>/<summary> elements, so it needs no client-side
 * JavaScript or state — it remains a Server Component. Usage inside MDX:
 *
 *   <PromptVault title="State Machine Logic">
 *     ...your notes...
 *   </PromptVault>
 */
export default function PromptVault({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="group my-6 border border-gray-800 bg-gray-900 open:border-gray-600">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-mono text-xs uppercase tracking-widest text-gray-300 transition-colors hover:text-white">
        <span>
          <span className="text-gray-500">Prompt Vault — </span>
          {title}
        </span>
        {/* Rotating chevron drawn with a single character; no imagery. */}
        <span
          aria-hidden
          className="transition-transform group-open:rotate-90"
        >
          ›
        </span>
      </summary>
      <div className="border-t border-gray-800 px-5 py-4 font-normal text-gray-300 [&>*+*]:mt-4">
        {children}
      </div>
    </details>
  );
}
