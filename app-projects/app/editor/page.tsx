import EditorForm from "@/components/editor/EditorForm";
import { readInbox } from "@/lib/inbox";

export const metadata = {
  title: "Editor — Developer Codex",
  // Hidden authoring surface — never index it.
  robots: { index: false, follow: false },
};

// Never statically cache the editor: the triage queue reflects live `_inbox`
// contents, and the whole surface is dev-only anyway.
export const dynamic = "force-dynamic";

/**
 * Local-first authoring dashboard. The form writes `.mdx` files straight to
 * the content directories via a Server Action — so the whole surface is
 * disabled in production, where the filesystem is read-only.
 */
export default function EditorPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center px-6">
        <div className="border border-gray-800 p-8">
          <h1 className="font-mono text-sm font-semibold uppercase tracking-widest text-white">
            Editor disabled in production
          </h1>
          <p className="mt-3 font-normal text-gray-400">
            Run the project locally to author content.
          </p>
        </div>
      </main>
    );
  }

  const inboxItems = readInbox();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-white">
        Editor
      </h1>
      <p className="mt-2 font-normal text-gray-400">
        Compose an entry directly, or bulk-drop media into the Inbox and triage
        it into entries. Frontmatter is generated for you.
      </p>

      <div className="mt-10">
        <EditorForm inboxItems={inboxItems} />
      </div>
    </main>
  );
}
