"use client";

import FlexSearch from "flexsearch";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SearchRecord } from "@/types";

/**
 * Global command palette (Cmd+K / Ctrl+K).
 *
 * A keyboard-first, Raycast/VS-Code-style navigator. The full-text index is
 * fetched once (lazily, on first open) from /api/search and searched entirely
 * in the browser with flexsearch. Input is debounced 150ms; results show a
 * context snippet with the matched query highlighted.
 */

const PILLAR_LABEL: Record<SearchRecord["pillar"], string> = {
  archive: "Archive",
  playbook: "Playbook",
  logbook: "Logbook",
};
// Fixed render order; the flattened order drives keyboard navigation.
const PILLAR_ORDER: SearchRecord["pillar"][] = ["archive", "playbook", "logbook"];
const BROWSE_LIMIT = 50;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A ~60-char window of `body` centered on the first query match. */
function makeSnippet(body: string, query: string): string {
  const q = query.trim().toLowerCase();
  if (!q) return body.slice(0, 90);
  const lower = body.toLowerCase();
  let idx = lower.indexOf(q);
  if (idx === -1) idx = lower.indexOf(q.split(/\s+/)[0]);
  if (idx === -1) return body.slice(0, 90);
  const start = Math.max(0, idx - 30);
  const end = Math.min(body.length, idx + 30);
  return `${start > 0 ? "…" : ""}${body.slice(start, end).trim()}${
    end < body.length ? "…" : ""
  }`;
}

/** Render `text`, wrapping query tokens in an inverse-aware <mark>. */
function Highlight({
  text,
  query,
  active,
}: {
  text: string;
  query: string;
  active: boolean;
}) {
  const tokens = useMemo(
    () => Array.from(new Set(query.trim().split(/\s+/).filter(Boolean))),
    [query]
  );
  if (tokens.length === 0) return <>{text}</>;

  const re = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "ig");
  const markClass = active ? "bg-black text-white" : "bg-white text-black";
  const lowered = new Set(tokens.map((t) => t.toLowerCase()));

  return (
    <>
      {text.split(re).map((seg, i) =>
        lowered.has(seg.toLowerCase()) ? (
          <mark key={i} className={markClass}>
            {seg}
          </mark>
        ) : (
          <span key={i}>{seg}</span>
        )
      )}
    </>
  );
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<SearchRecord[] | null>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey + custom "codex:search" event (from the header button).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("codex:search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("codex:search", onOpen);
    };
  }, []);

  // Lazy-load the index the first time the palette opens.
  useEffect(() => {
    if (!open || records) return;
    fetch("/api/search")
      .then((res) => res.json())
      .then((data: SearchRecord[]) => setRecords(data))
      .catch(() => setRecords([]));
  }, [open, records]);

  // Focus + scroll-lock while open; reset on close.
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setDebounced("");
      setActiveIndex(0);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // 150ms debounce so a decade of text doesn't re-render on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(id);
  }, [query]);

  // Build the flexsearch index once per loaded dataset. Guarded so it is only
  // ever constructed on the client, after the index has been fetched (never
  // during SSR, where `records` is null).
  const flex = useMemo(() => {
    if (!records) return null;
    const doc = new FlexSearch.Document({
      tokenize: "forward",
      document: { id: "id", index: ["title", "tags", "body"] },
    });
    records.forEach((record, i) =>
      doc.add({
        id: i,
        title: record.title,
        tags: record.tags.join(" "),
        body: record.body,
      })
    );
    return doc;
  }, [records]);

  // Matched records in fixed pillar order — this IS the keyboard nav order.
  const results = useMemo(() => {
    if (!records) return [];
    const q = debounced.trim();

    let matched: SearchRecord[];
    if (!q || !flex) {
      matched = records.slice(0, BROWSE_LIMIT);
    } else {
      const ids = new Set<number>();
      const raw = flex.search(q, { limit: 30 }) as Array<{ result: number[] }>;
      raw.forEach((group) => group.result.forEach((id) => ids.add(id)));
      matched = Array.from(ids).map((id) => records[id]);
    }

    return matched.sort(
      (a, b) =>
        PILLAR_ORDER.indexOf(a.pillar) - PILLAR_ORDER.indexOf(b.pillar)
    );
  }, [debounced, flex, records]);

  useEffect(() => setActiveIndex(0), [debounced]);

  const close = useCallback(() => setOpen(false), []);
  const go = useCallback(
    (record?: SearchRecord) => {
      if (!record) return;
      close();
      router.push(record.url);
    },
    [close, router]
  );

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  if (!open) return null;

  let runningIndex = -1;
  const grouped = PILLAR_ORDER.map((pillar) => ({
    pillar,
    items: results.filter((r) => r.pillar === pillar),
  })).filter((group) => group.items.length > 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search the codex"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 px-4 pt-[12vh] backdrop-blur-md transition-opacity duration-150"
      onMouseDown={close}
    >
      <div
        className="w-full max-w-xl border border-gray-700 bg-black shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-gray-800 px-4">
          <span aria-hidden className="font-mono text-sm text-gray-400">
            /
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search the codex…"
            aria-label="Search query"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="cmdk-listbox"
            aria-activedescendant={
              results.length > 0 ? `cmdk-option-${activeIndex}` : undefined
            }
            className="w-full bg-transparent py-4 font-normal text-white placeholder:text-gray-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={close}
            aria-label="Close search"
            className="border border-gray-700 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest text-gray-400 transition-opacity duration-150 hover:opacity-70"
          >
            Esc
          </button>
        </div>

        <div
          id="cmdk-listbox"
          role="listbox"
          aria-label="Search results"
          className="max-h-[50vh] overflow-y-auto"
        >
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center font-normal text-gray-400">
              {records === null ? "Loading index…" : "No matches."}
            </p>
          ) : (
            grouped.map((group) => (
              <div key={group.pillar} className="py-2" role="group">
                <p className="px-4 py-1 font-mono text-[0.65rem] uppercase tracking-widest text-gray-400">
                  From {PILLAR_LABEL[group.pillar]}
                </p>
                <ul>
                  {group.items.map((record) => {
                    runningIndex += 1;
                    const isActive = runningIndex === activeIndex;
                    const flatIndex = runningIndex;
                    return (
                      <li key={record.id}>
                        <button
                          type="button"
                          id={`cmdk-option-${flatIndex}`}
                          role="option"
                          aria-selected={isActive}
                          tabIndex={-1}
                          onClick={() => go(record)}
                          onMouseMove={() => setActiveIndex(flatIndex)}
                          className={`block w-full px-4 py-2 text-left transition-opacity duration-150 ${
                            isActive ? "bg-white text-black" : "bg-black text-gray-300"
                          }`}
                        >
                          <span className="block font-semibold">
                            <Highlight
                              text={record.title}
                              query={debounced}
                              active={isActive}
                            />
                          </span>
                          <span
                            className={`block truncate text-sm ${
                              isActive ? "text-gray-700" : "text-gray-400"
                            }`}
                          >
                            <Highlight
                              text={makeSnippet(record.body, debounced)}
                              query={debounced}
                              active={isActive}
                            />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
