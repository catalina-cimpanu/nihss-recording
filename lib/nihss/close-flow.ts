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

export type CloseFlowScreen =
  | "idle"
  | "warning"
  | "afterCompletion"
  | "examClose"
  | "followup";

export type CloseFlowUi = {
  screen: CloseFlowScreen;
  erhebungConfirm: boolean;
  lyseOrder: boolean;
  hasWarning: boolean;
};

export const INITIAL_CLOSE_FLOW: CloseFlowUi = {
  screen: "idle",
  erhebungConfirm: false,
  lyseOrder: false,
  hasWarning: false,
};

export type CloseFlowAction =
  | { type: "stop-requested"; needsWarning: boolean }
  | { type: "cancel-exam-flow" }
  | { type: "warning-continue" }
  | { type: "after-continue" }
  | { type: "exam-closed" }
  | { type: "followup-saved" }
  | { type: "followup-close-requested" }
  | { type: "erhebung-confirm-cancel" }
  | { type: "erhebung-closed" }
  | { type: "open-erhebung-confirm" }
  | { type: "auto-close-exam" }
  | { type: "lyse-order-open" }
  | { type: "lyse-order-close" };

export function reduceCloseFlow(
  state: CloseFlowUi,
  action: CloseFlowAction,
): CloseFlowUi {
  switch (action.type) {
    case "stop-requested":
      if (action.needsWarning) {
        return {
          ...state,
          hasWarning: true,
          screen: "warning",
          erhebungConfirm: false,
        };
      }
      return {
        ...state,
        hasWarning: false,
        screen: "afterCompletion",
        erhebungConfirm: false,
      };
    case "cancel-exam-flow":
      return { ...state, screen: "idle", erhebungConfirm: false };
    case "warning-continue":
      return { ...state, screen: "afterCompletion" };
    case "after-continue":
      return { ...state, screen: "examClose" };
    case "exam-closed":
      return { ...state, screen: "followup", erhebungConfirm: false };
    case "followup-saved":
      return { ...state, screen: "idle", erhebungConfirm: false };
    case "followup-close-requested":
      return { ...state, erhebungConfirm: true };
    case "erhebung-confirm-cancel":
      return { ...state, erhebungConfirm: false };
    case "erhebung-closed":
      return { ...state, screen: "idle", erhebungConfirm: false };
    case "open-erhebung-confirm":
      return { ...state, erhebungConfirm: true };
    case "auto-close-exam":
      return { ...state, screen: "idle", erhebungConfirm: false };
    case "lyse-order-open":
      return { ...state, lyseOrder: true };
    case "lyse-order-close":
      return { ...state, lyseOrder: false };
  }
}
