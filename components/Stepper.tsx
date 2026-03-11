interface StepperProps {
  step: number;
}

const steps = ["Serviço", "Barbeiro", "Data", "Horário", "Confirmar"];

export default function Stepper({ step }: StepperProps) {
  return (
    <div className="flex items-center justify-between mb-12">
      {steps.map((label, index) => {
        const current = index + 1;

        return (
          <div key={label} className="flex-1 flex items-center">
            <div className="flex flex-col items-center w-full">
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-black transition-all duration-500
              ${
                 current === step
                  ? "bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.6)] scale-110"
                  : current < step
                  ? "bg-orange-500/20 border border-orange-500/40 text-orange-500"
                  : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {current}
              </div>

              <span
                className={`mt-2 text-xs ${
                  current <= step ? "text-white" : "text-zinc-500"
                }`}
              >
                {label}
              </span>
            </div>

            {index !== steps.length - 1 && (
              <div className="flex-1 h-[1px] bg-zinc-800"></div>
            )}
          </div>
        );
      })}
    </div>
  );
}
