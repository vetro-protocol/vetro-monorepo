type Step = {
  description: string;
  title: string;
};

type Props = {
  steps: Step[];
};

export const VerticalStepper = ({ steps }: Props) => (
  <div className="flex flex-col gap-5 py-4">
    {steps.map((step, index) => (
      <div className="flex gap-4" key={`${step.title}-${index}`}>
        {/* Step circle with connector line */}
        <div className="relative flex shrink-0 flex-col items-center">
          <div className="relative z-10 flex size-4 items-center justify-center rounded-full bg-blue-50">
            <span className="text-[8px] leading-none font-semibold text-blue-500">
              {index + 1}
            </span>
          </div>
          {/* Line connecting to next step - extends through the gap */}
          {index < steps.length - 1 && (
            <div className="-mb-5 w-0.5 flex-1 rounded-full bg-blue-50" />
          )}
        </div>

        {/* Step content */}
        <div className="flex flex-col gap-0.5">
          <p className="text-sm leading-5 font-semibold text-gray-900">
            {step.title}
          </p>
          <p className="text-sm leading-5 text-gray-500">{step.description}</p>
        </div>
      </div>
    ))}
  </div>
);
