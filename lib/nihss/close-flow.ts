export type CloseFlowStage =
  | "warning"
  | "afterCompletion"
  | "examClose"
  | "followup";

export type CloseFlowStep = {
  current: number;
  total: number;
};

export function closeFlowStep(
  stage: CloseFlowStage,
  hasWarning: boolean,
): CloseFlowStep {
  const stages: CloseFlowStage[] = hasWarning
    ? ["warning", "afterCompletion", "examClose", "followup"]
    : ["afterCompletion", "examClose", "followup"];
  return { current: stages.indexOf(stage) + 1, total: stages.length };
}

export function formatCloseFlowStep(step: CloseFlowStep): string {
  return `Schritt ${step.current} von ${step.total}`;
}
