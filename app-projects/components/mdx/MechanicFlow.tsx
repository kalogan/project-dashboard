/**
 * <MechanicFlow> — a stylized vertical stepper for sequential logic:
 * state-machine transitions (Idle → Attack → Cooldown) or branching narrative.
 *
 * Server Component. Styled to look like a timeline but mapped to a semantic
 * <ol> so screen readers announce it as an ordered sequence.
 */

export type MechanicStep = string | { title: string; description?: string };

function normalize(step: MechanicStep): { title: string; description?: string } {
  return typeof step === "string" ? { title: step } : step;
}

export default function MechanicFlow({ steps }: { steps: MechanicStep[] }) {
  return (
    <ol className="my-6 ml-2 border-l-2 border-gray-800">
      {steps.map((rawStep, index) => {
        const step = normalize(rawStep);
        return (
          <li key={index} className="relative py-3 pl-6">
            {/* Circular node sitting on the 2px border line. */}
            <span
              aria-hidden
              className="absolute left-0 top-4 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-gray-800 bg-black"
            />
            <p className="font-semibold text-white">{step.title}</p>
            {step.description && (
              <p className="mt-1 font-normal text-gray-300">
                {step.description}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
