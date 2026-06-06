"use client";

import { useRef, useState } from "react";
import { askCodex } from "@/app/actions/askCodex";
import type { ChatTurn } from "@/types";

/**
 * The "Grill Me" interrogator pane.
 *
 * Holds the full conversation in React state and replays it to the server
 * action each turn, so Gemini remembers the original brain-dump while it asks
 * follow-ups. Monochrome by design: user turns align right with a white right
 * rule; model turns align left with a gray left rule.
 */

/** Pull the synthesized MDX out of a ```mdx fenced block, if present. */
function extractMdx(text: string): string {
  const match = text.match(/```(?:mdx|markdown)?\n([\s\S]*?)```/);
  return (match ? match[1] : text).trim();
}

export default function Interrogator({
  onInsert,
}: {
  onInsert: (markdown: string) => void;
}) {
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || pending) return;

    const priorHistory = history;
    setHistory((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setPending(true);
    setError(null);

    try {
      const reply = await askCodex(priorHistory, message);
      setHistory((prev) => [...prev, { role: "model", text: reply }]);
      requestAnimationFrame(() => {
        logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-full flex-col border border-gray-800">
      <h2 className="border-b border-gray-800 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-gray-400">
        Grill Me
      </h2>

      <div ref={logRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {history.length === 0 && (
          <p className="font-normal text-sm text-gray-400">
            Drop a messy brain-dump below. I will interrogate you and synthesize
            the MDX.
          </p>
        )}

        {history.map((turn, i) =>
          turn.role === "user" ? (
            <div key={i} className="border-r border-white pr-3 text-right">
              <p className="whitespace-pre-wrap font-normal text-white">
                {turn.text}
              </p>
            </div>
          ) : (
            <div key={i} className="border-l border-gray-600 pl-3">
              <p className="whitespace-pre-wrap font-normal text-gray-400">
                {turn.text}
              </p>
              <button
                type="button"
                onClick={() => onInsert(extractMdx(turn.text))}
                className="mt-2 rounded-none border border-gray-800 px-2 py-1 font-mono text-[0.6rem] uppercase tracking-widest text-gray-400 transition-colors hover:bg-gray-900 hover:text-white"
              >
                Insert to Editor
              </button>
            </div>
          )
        )}

        {pending && (
          <p className="border-l border-gray-600 pl-3 font-mono text-xs uppercase tracking-widest text-gray-400">
            Thinking…
          </p>
        )}
        {error && (
          <p className="border-l border-white pl-3 font-normal text-sm text-white">
            {error}
          </p>
        )}
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-gray-800 p-3">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Message the Codex Editor…"
          aria-label="Message the Codex Editor"
          className="w-full rounded-none border border-gray-800 bg-black px-3 py-2 font-mono text-sm text-white placeholder:text-gray-400 focus:border-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-none border border-white bg-white px-3 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-black transition-opacity duration-150 hover:opacity-80 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
