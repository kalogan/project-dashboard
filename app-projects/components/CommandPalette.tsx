"use client";

import Fuse from "fuse.js";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Global command palette (Cmd+K / Ctrl+K).
 *
 * A keyboard-first, Raycast/VS-Code-style navigator over the entire codex. The
 * lightweight search index is fetched once (on first open) from /api/search and
 * searched on the client with fuse.js. Results are grouped by pillar; the
 * active row is rendered in inverse high-contrast (white on black).
 */

interface SearchRecord {
  title: string;
  url_path: string;
  category: string;
  excerpt: string;
}

/** Derive the pillar label from a record's URL — no extra index field needed. */
function pillarOf(urlPath: string): string {
  if (urlPath.startsWith("/archive")) return "Archive";
  if (urlPath.startsWith("/playbook")) return "Playbook";
  return "Codex";
}

// Pillars render in this fixed order; flattened nav order matches it.
const PILLAR_ORDER = ["Archive", "Playbook", "Codex"];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<SearchRecord[] | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey: Cmd+K (mac) / Ctrl+K (win/linux) toggles the palette. A
  // custom "codex:search" event lets non-keyboard affordances (e.g. the header
  // button) open it without sharing React state across the tree.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("codex:search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("codex:search", onOpen);
    };
  }, []);

  // Lazy-load the search index the first time the palette opens.
  useEffect(() => {
    if (!open || index) return;
    fetch("/api/search")
      .then((res) => res.json())
      .then((data: SearchRecord[]) => setIndex(data))
      .catch(() => setIndex([]));
  }, [open, index]);

  // Focus the input and lock body scroll while open; reset on close.
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setActiveIndex(0);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const fuse = useMemo(
    () =>
      new Fuse(index ?? [], {
        keys: ["title", "category", "excerpt"],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [index]
  );

  // Flattened results in pillar order — this IS the keyboard navigation order.
  const results = useMemo(() => {
    const matched = query.trim()
      ? fuse.search(query).map((r) => r.item)
      : (index ?? []);

    return [...matched].sort(
      (a, b) =>
        PILLAR_ORDER.indexOf(pillarOf(a.url_path)) -
        PILLAR_ORDER.indexOf(pillarOf(b.url_path))
    );
  }, [query, fuse, index]);

  // Keep the active index in range whenever the result set changes.
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const close = useCallback(() => setOpen(false), []);

  const go = useCallback(
    (record?: SearchRecord) => {
      if (!record) return;
      close();
      router.push(record.url_path);
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

  // Group for display while preserving the flat index used for highlighting.
  let runningIndex = -1;
  const grouped = PILLAR_ORDER.map((pillar) => ({
    pillar,
    items: results.filter((r) => pillarOf(r.url_path) === pillar),
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
              {index === null ? "Loading index…" : "No matches."}
            </p>
          ) : (
            grouped.map((group) => (
              <div key={group.pillar} className="py-2" role="group">
                <p className="px-4 py-1 font-mono text-[0.65rem] uppercase tracking-widest text-gray-400">
                  From {group.pillar}
                </p>
                <ul>
                  {group.items.map((record) => {
                    runningIndex += 1;
                    const isActive = runningIndex === activeIndex;
                    const flatIndex = runningIndex;
                    return (
                      <li key={record.url_path}>
                        <button
                          type="button"
                          id={`cmdk-option-${flatIndex}`}
                          role="option"
                          aria-selected={isActive}
                          tabIndex={-1}
                          onClick={() => go(record)}
                          onMouseMove={() => setActiveIndex(flatIndex)}
                          className={`block w-full px-4 py-2 text-left transition-opacity duration-150 ${
                            isActive
                              ? "bg-white text-black"
                              : "bg-black text-gray-300"
                          }`}
                        >
                          <span className="block font-semibold">
                            {record.title}
                          </span>
                          <span
                            className={`block truncate text-sm ${
                              isActive ? "text-gray-700" : "text-gray-400"
                            }`}
                          >
                            {record.excerpt}
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
