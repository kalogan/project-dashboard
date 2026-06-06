"use client";

import { useRef, useState } from "react";
import { saveMdxFile } from "@/app/actions/saveMdx";
import { uploadImage } from "@/app/actions/uploadMedia";
import Interrogator from "@/components/editor/Interrogator";
import Triage from "@/components/editor/Triage";
import type { InboxItem } from "@/types";

/**
 * The local-first authoring form.
 *
 * Controlled <textarea> so we can (a) inject bespoke-component snippets at the
 * caret and (b) handle pasted/dropped images: a placeholder is dropped in
 * instantly at the cursor, the file is shipped to the upload action, and the
 * placeholder is swapped for the final markdown once the .webp URL returns.
 */

const INPUT =
  "w-full rounded-none border border-gray-800 bg-black px-3 py-2 font-mono text-sm text-white placeholder:text-gray-400 focus:border-white focus:outline-none";

// Snippet library for the cheat-sheet insert buttons.
const SNIPPETS: { label: string; snippet: string }[] = [
  {
    label: "SpecSheet",
    snippet:
      '<SpecSheet title="Title" specs={[{ label: "Key", value: "Value" }]} />',
  },
  {
    label: "TerminalBlock",
    snippet: '<TerminalBlock label="bash" command="echo hello" />',
  },
  {
    label: "MechanicFlow",
    snippet:
      '<MechanicFlow steps={[{ title: "Step", description: "Detail" }]} />',
  },
  {
    label: "PromptVault",
    snippet: '<PromptVault title="Title">\n\nNotes…\n\n</PromptVault>',
  },
];

let uploadCounter = 0;

export default function EditorForm({
  inboxItems,
}: {
  inboxItems: InboxItem[];
}) {
  const [body, setBody] = useState("");
  const [tab, setTab] = useState<"compose" | "inbox">("compose");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Splice `text` into the body at the current selection, then refocus. */
  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    const next = body.slice(0, start) + text + body.slice(end);
    setBody(next);

    // Restore the caret just after the inserted text on the next tick.
    requestAnimationFrame(() => {
      if (!el) return;
      const caret = start + text.length;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }

  /** Insert a unique placeholder at `start`, upload the file, then swap it. */
  async function ingestImage(file: File, start: number) {
    const token = `![Uploading-${++uploadCounter}…]()`;
    setBody((prev) => prev.slice(0, start) + token + prev.slice(start));

    try {
      const formData = new FormData();
      formData.append("image", file);
      const url = await uploadImage(formData);
      setBody((prev) => prev.replace(token, `![Asset](${url})`));
    } catch {
      setBody((prev) => prev.replace(token, "![Upload failed]()"));
    }
  }

  function onPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const file = Array.from(event.clipboardData.files).find((f) =>
      f.type.startsWith("image/")
    );
    if (!file) return; // let normal text paste through
    event.preventDefault();
    ingestImage(file, event.currentTarget.selectionStart);
  }

  function onDrop(event: React.DragEvent<HTMLTextAreaElement>) {
    const file = Array.from(event.dataTransfer.files).find((f) =>
      f.type.startsWith("image/")
    );
    if (!file) return;
    event.preventDefault();
    ingestImage(file, event.currentTarget.selectionStart);
  }

  const tabClass = (active: boolean) =>
    `rounded-none border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
      active
        ? "border-white bg-white text-black"
        : "border-gray-800 text-gray-400 hover:text-white"
    }`;

  return (
    <div>
      {/* Tabs */}
      <div className="mb-8 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("compose")}
          className={tabClass(tab === "compose")}
        >
          Compose
        </button>
        <button
          type="button"
          onClick={() => setTab("inbox")}
          className={tabClass(tab === "inbox")}
        >
          Inbox ({inboxItems.length})
        </button>
      </div>

      {tab === "inbox" ? (
        <Triage items={inboxItems} />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left column — the Interrogator. */}
          <aside className="lg:sticky lg:top-8 lg:col-span-1 lg:h-[calc(100vh-6rem)]">
            <Interrogator onInsert={insertAtCursor} />
          </aside>

          {/* Right column — the Canvas. */}
          <form action={saveMdxFile} className="space-y-6 lg:col-span-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block font-mono text-xs uppercase tracking-widest text-gray-400">
            Pillar
          </span>
          <select name="pillar" defaultValue="logbook" className={INPUT}>
            <option value="logbook">Logbook</option>
            <option value="archive">Archive</option>
            <option value="playbook">Playbook</option>
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block font-mono text-xs uppercase tracking-widest text-gray-400">
            Title
          </span>
          <input
            name="title"
            required
            placeholder="My new entry"
            className={INPUT}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block font-mono text-xs uppercase tracking-widest text-gray-400">
          Tags (comma separated)
        </span>
        <input
          name="tags"
          placeholder="electron, postmortem"
          className={INPUT}
        />
      </label>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-widest text-gray-400">
            Body (Markdown / MDX)
          </span>
          <span className="font-mono text-[0.65rem] uppercase tracking-widest text-gray-400">
            Paste or drop an image to upload
          </span>
        </div>
        <textarea
          ref={textareaRef}
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onPaste={onPaste}
          onDrop={onDrop}
          rows={20}
          placeholder="# Write here…"
          className={`${INPUT} resize-y leading-relaxed`}
        />

        {/* Clinical cheat sheet: insert bespoke components at the caret. */}
        <div className="mt-3 flex flex-wrap gap-2">
          {SNIPPETS.map(({ label, snippet }) => (
            <button
              key={label}
              type="button"
              onClick={() => insertAtCursor(snippet)}
              className="rounded-none border border-gray-800 px-2 py-1 font-mono text-[0.65rem] uppercase tracking-widest text-gray-400 transition-colors hover:bg-gray-900 hover:text-white"
            >
              + {label}
            </button>
          ))}
        </div>
      </div>

        <button
          type="submit"
          className="rounded-none border border-white bg-white px-4 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-black transition-opacity duration-150 hover:opacity-80"
        >
          Save entry
        </button>
          </form>
        </div>
      )}
    </div>
  );
}
