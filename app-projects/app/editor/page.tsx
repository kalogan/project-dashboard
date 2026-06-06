import EditorForm from "@/components/editor/EditorForm";

export const metadata = {
  title: "Editor — Developer Codex",
  // Hidden authoring surface — never index it.
  robots: { index: false, follow: false },
};

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

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-white">
        Editor
      </h1>
      <p className="mt-2 font-normal text-gray-400">
        Author a new entry. Frontmatter is generated for you; the file lands in
        the chosen pillar and you are taken straight to the rendered page.
      </p>

      <div className="mt-10">
        <EditorForm />
      </div>
    </main>
  );
}
