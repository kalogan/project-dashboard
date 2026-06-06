"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { bulkUpload } from "@/app/actions/bulkUpload";
import { commitInbox } from "@/app/actions/commitInbox";
import type { InboxItem } from "@/types";

/**
 * The Triage Queue.
 *
 * Drop raw files in bulk → they land in `_inbox` (with EXIF dates) and render
 * as a thumbnail grid. Click to select (shift-click for ranges), then Commit:
 * one file becomes a single entry, many become a unified gallery entry. The
 * server compresses + files everything and deletes the raw originals.
 */
const INPUT =
  "w-full rounded-none border border-gray-800 bg-black px-3 py-2 font-mono text-sm text-white placeholder:text-gray-400 focus:border-white focus:outline-none";

export default function Triage({ items }: { items: InboxItem[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [anchor, setAnchor] = useState<number | null>(null);
  const [busy, setBusy] = useState<null | string>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Modal fields.
  const [pillar, setPillar] = useState("logbook");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [tags, setTags] = useState("");

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setBusy(`Uploading ${fileList.length} file(s)…`);
    setStatus(null);
    try {
      const fd = new FormData();
      Array.from(fileList).forEach((f) => fd.append("files", f));
      const { count } = await bulkUpload(fd);
      setStatus(`Queued ${count} file(s).`);
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  function toggle(index: number, name: string, shiftKey: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (shiftKey && anchor !== null) {
        const [lo, hi] = [Math.min(anchor, index), Math.max(anchor, index)];
        for (let i = lo; i <= hi; i++) next.add(items[i].name);
      } else if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
    setAnchor(index);
  }

  function openModal() {
    if (selected.size === 0) return;
    const first = items.find((it) => selected.has(it.name));
    setDate(first?.capturedAt ?? new Date().toISOString().slice(0, 10));
    setTitle("");
    setTags("");
    setModalOpen(true);
  }

  async function commit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(
      selected.size > 1
        ? `Processing ${selected.size} files (gallery)…`
        : "Processing…"
    );
    setModalOpen(false);
    try {
      const fd = new FormData();
      selected.forEach((name) => fd.append("names", name));
      fd.append("pillar", pillar);
      fd.append("title", title);
      fd.append("date", date);
      fd.append("tags", tags);
      const res = await commitInbox(fd);
      setStatus(`Committed ${res.count} asset(s) → ${res.path}`);
      setSelected(new Set());
      setAnchor(null);
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Commit failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {/* Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer border border-dashed border-gray-700 px-6 py-10 text-center transition-colors hover:border-gray-500"
      >
        <p className="font-mono text-sm uppercase tracking-widest text-gray-400">
          Drop files here, or click to browse
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => uploadFiles(e.target.files)}
        />
      </div>

      {/* Toolbar */}
      <div className="mt-4 flex items-center justify-between border-y border-gray-800 py-3">
        <span className="font-mono text-xs uppercase tracking-widest text-gray-400">
          {items.length} queued · {selected.size} selected
        </span>
        <button
          type="button"
          onClick={openModal}
          disabled={selected.size === 0 || busy !== null}
          className="rounded-none border border-white bg-white px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-black transition-opacity duration-150 hover:opacity-80 disabled:opacity-30"
        >
          {selected.size > 1 ? "Commit gallery" : "Commit"}
        </button>
      </div>

      {(busy || status) && (
        <p className="mt-3 font-mono text-xs uppercase tracking-widest text-gray-400">
          {busy ?? status}
        </p>
      )}

      {/* Thumbnail grid (CSS columns) */}
      {items.length === 0 ? (
        <p className="mt-8 font-normal text-sm text-gray-400">
          The inbox is empty. Drop some files above to begin triaging.
        </p>
      ) : (
        <div className="mt-4 columns-2 gap-3 sm:columns-3">
          {items.map((item, index) => {
            const isSelected = selected.has(item.name);
            return (
              <button
                type="button"
                key={item.name}
                onClick={(e) => toggle(index, item.name, e.shiftKey)}
                aria-pressed={isSelected}
                className={`relative mb-3 block w-full break-inside-avoid border text-left transition-colors ${
                  isSelected ? "border-white" : "border-gray-800 hover:border-gray-500"
                }`}
              >
                {item.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/inbox/${encodeURIComponent(item.name)}`}
                    alt={item.name}
                    className="h-auto w-full"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-gray-900">
                    <span className="font-mono text-[0.6rem] uppercase tracking-widest text-gray-400">
                      {item.kind}
                    </span>
                  </div>
                )}
                {item.capturedAt && (
                  <span className="absolute bottom-1 left-1 bg-black/70 px-1 font-mono text-[0.6rem] tabular-nums text-white">
                    {item.capturedAt}
                  </span>
                )}
                {isSelected && (
                  <span className="absolute right-1 top-1 bg-white px-1 font-mono text-[0.6rem] font-semibold uppercase text-black">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Assignment modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md"
          onMouseDown={() => setModalOpen(false)}
        >
          <form
            onMouseDown={(e) => e.stopPropagation()}
            onSubmit={commit}
            className="w-full max-w-md space-y-4 border border-gray-700 bg-black p-6"
          >
            <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-gray-400">
              Commit {selected.size} file(s)
              {selected.size > 1 ? " as one gallery" : ""}
            </h3>
            <label className="block">
              <span className="mb-1 block font-mono text-xs uppercase tracking-widest text-gray-400">
                Pillar
              </span>
              <select
                value={pillar}
                onChange={(e) => setPillar(e.target.value)}
                className={INPUT}
              >
                <option value="logbook">Logbook</option>
                <option value="archive">Archive</option>
                <option value="playbook">Playbook</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-xs uppercase tracking-widest text-gray-400">
                Title
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={INPUT}
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-xs uppercase tracking-widest text-gray-400">
                Date {selected.size > 0 && "(pre-filled from EXIF)"}
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={INPUT}
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-xs uppercase tracking-widest text-gray-400">
                Tags (comma separated)
              </span>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className={INPUT}
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-none border border-gray-700 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-gray-400 transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-none border border-white bg-white px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-black transition-opacity duration-150 hover:opacity-80"
              >
                Commit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
