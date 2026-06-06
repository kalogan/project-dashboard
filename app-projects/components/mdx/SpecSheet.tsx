/**
 * <SpecSheet> — a semantic description list for documenting rigid
 * specifications: espresso ratios, server IPs, engine physics constants.
 *
 * Server Component (no interactivity). Renders a real <dl>/<dt>/<dd> so the
 * key/value relationship is exposed to assistive tech.
 */

export interface Spec {
  label: string;
  value: string;
}

export default function SpecSheet({
  title,
  specs,
}: {
  title?: string;
  specs: Spec[];
}) {
  return (
    <section className="my-6 border border-gray-800">
      {title && (
        <h3 className="border-b border-gray-800 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-gray-400">
          {title}
        </h3>
      )}
      <dl className="divide-y divide-gray-800">
        {specs.map((spec) => (
          <div
            key={spec.label}
            className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4"
          >
            <dt className="font-mono text-xs uppercase tracking-widest text-gray-400">
              {spec.label}
            </dt>
            <dd className="font-semibold text-white">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
