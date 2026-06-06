import { evaluate } from "@mdx-js/mdx";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { mdxComponents } from "@/components/MdxProvider";
import { injectWikiLinks } from "@/lib/mdx";

/**
 * Server-side MDX renderer.
 *
 * Uses @mdx-js/mdx `evaluate` rather than next-mdx-remote so that JSX
 * expression props (e.g. `<SpecSheet specs={[...]} />`) survive — next-mdx-
 * remote's RSC path strips all `{}` expressions by default. Content here is
 * authored locally and fully trusted, so evaluating it is safe.
 */
export default async function Mdx({ source }: { source: string }) {
  const processed = injectWikiLinks(source);
  const { default: Content } = await evaluate(processed, {
    Fragment,
    jsx,
    jsxs,
  });
  return <Content components={mdxComponents} />;
}
