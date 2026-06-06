import type { ReactNode } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import PlaybookSidebar from "@/components/PlaybookSidebar";
import { getPlaybookTree } from "@/lib/mdx";

export const metadata = {
  title: "Playbook — Developer Codex",
  description:
    "A living wiki of methodologies, AI workflows, and specifications.",
};

/**
 * Documentation-style layout for the Playbook: a sticky sidebar on the left
 * (a select dropdown on mobile) and the rendered MDX content on the right.
 * The navigation tree is read server-side and handed to the client sidebar.
 */
export default function PlaybookLayout({
  children,
}: {
  children: ReactNode;
}) {
  const tree = getPlaybookTree();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[16rem_1fr]">
        <aside>
          <PlaybookSidebar tree={tree} />
        </aside>

        <div className="min-w-0">
          <Breadcrumbs />
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
