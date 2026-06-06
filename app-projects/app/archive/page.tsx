import ArchiveExplorer from "@/components/ArchiveExplorer";
import { getAllArchiveEntries } from "@/lib/mdx";

export const metadata = {
  title: "Archive — Developer Codex",
  description:
    "A masonry showcase of polished work, with the full 14-year history one toggle away.",
};

/**
 * The Archive index — a Server Component that loads the full dataset at build
 * time and hands it to the client-side filtering shell. The default render is
 * strictly the polished showcase; the deep archive is opt-in.
 */
export default function ArchivePage() {
  const entries = getAllArchiveEntries();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-white">
        Archive
      </h1>
      <p className="mt-2 max-w-2xl font-normal text-gray-400">
        The work, newest first. A polished showcase by default — flip the switch
        to excavate the full history.
      </p>

      <ArchiveExplorer entries={entries} />
    </main>
  );
}
