'use client';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export default function StepIndicator({
  currentStep,
  totalSteps,
  labels,
}: StepIndicatorProps) {
  return (
    <div className="stepper">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={i} className="stepper-step flex items-center">
            <div className="relative">
              <div
                className={`stepper-circle ${
                  isCompleted ? 'completed' : isActive ? 'active' : ''
                }`}
              >
                {isCompleted ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`stepper-label ${
                  isCompleted ? 'completed' : isActive ? 'active' : ''
                }`}
              >
                {labels[i]}
              </span>
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`stepper-line ${isCompleted ? 'completed' : ''}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
