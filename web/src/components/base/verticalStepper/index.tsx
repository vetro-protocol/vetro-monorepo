type Step = {
  description: string;
  title: string;
};

type Props = {
  currentStep?: number;
  mode?: "list" | "progress";
  steps: Step[];
};

const CheckIcon = () => (
  <svg
    aria-hidden="true"
    className="size-2.5"
    fill="none"
    stroke="white"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2.5}
    viewBox="0 0 12 12"
  >
    <path d="M2 6l3 3 5-5" />
  </svg>
);

export const VerticalStepper = function ({
  currentStep,
  mode = "progress",
  steps,
}: Props) {
  const activeStep = currentStep ?? 0;

  return (
    <div className="flex flex-col gap-5 py-4">
      {steps.map(function (step, index) {
        const isCompleted = mode === "progress" && index < activeStep;
        const notReady = mode === "progress" && index > activeStep;

        return (
          <div className="flex gap-4" key={`${step.title}-${index}`}>
            {/* Step circle with connector line */}
            <div className="relative flex shrink-0 flex-col items-center">
              {isCompleted ? (
                <div className="relative z-10 flex size-4 items-center justify-center rounded-full bg-blue-500">
                  <CheckIcon />
                </div>
              ) : (
                <div
                  className={`relative z-10 flex size-4 items-center justify-center rounded-full ${
                    notReady
                      ? "bg-gray-100 text-gray-600"
                      : "bg-blue-50 text-blue-500"
                  }`}
                >
                  <span className="text-[8px] leading-none font-semibold">
                    {index + 1}
                  </span>
                </div>
              )}
              {/* Line connecting to next step - extends through the gap */}
              {index < steps.length - 1 && (
                <div
                  className={`-mb-5 w-0.5 flex-1 rounded-full ${
                    notReady ? "bg-gray-100" : "bg-blue-50"
                  }`}
                />
              )}
            </div>

            {/* Step content */}
            <div className="flex flex-col gap-0.5 text-sm leading-5">
              <p className="font-semibold text-gray-900">{step.title}</p>
              <p className="text-gray-500">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
