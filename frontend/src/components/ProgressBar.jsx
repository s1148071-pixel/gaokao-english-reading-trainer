export default function ProgressBar({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0 px-4 py-6">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`step-dot ${
                currentStep > step.id
                  ? 'step-dot-done'
                  : currentStep === step.id
                  ? 'step-dot-active'
                  : 'step-dot-pending'
              }`}
            >
              {currentStep > step.id ? '✓' : step.id}
            </div>
            <span
              className={`text-xs font-medium whitespace-nowrap ${
                currentStep >= step.id ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`step-line ${currentStep > step.id ? 'step-line-done' : 'step-line-pending'}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
