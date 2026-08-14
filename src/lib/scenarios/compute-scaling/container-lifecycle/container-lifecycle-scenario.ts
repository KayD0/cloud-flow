export const CONTAINER_STAGES = [
  { id: "created", label: "Created", detail: "Container の定義だけが作成され、まだ処理を受け付けていません。" },
  { id: "starting", label: "Starting", detail: "起動処理中です。準備が整うまでは処理を投入できません。" },
  { id: "ready", label: "Ready", detail: "起動が完了し、合成した処理を受け付けられます。" },
  { id: "processing", label: "Processing", detail: "投入された合成処理を実行しています。完了すると Ready に戻ります。" },
  { id: "stopped", label: "Stopped", detail: "停止済みです。処理は受け付けず、起動または再起動を待ちます。" },
  { id: "restarting", label: "Restarting", detail: "停止と再作成をまとめて行っています。Starting を経て Ready に戻ります。" },
] as const;
export type ContainerStage = (typeof CONTAINER_STAGES)[number]["id"];
export type PlaybackState = "idle" | "running" | "paused";
export interface ContainerLifecycleState { stage: ContainerStage; playback: PlaybackState; completedJobs: number; rejectedJobs: number; message: string; }
export type ContainerLifecycleAction = { type: "play" } | { type: "pause" } | { type: "tick" } | { type: "start-container" } | { type: "stop-container" } | { type: "submit-job" } | { type: "restart-container" } | { type: "reset" };
export const initialContainerLifecycleState: ContainerLifecycleState = { stage: "created", playback: "idle", completedJobs: 0, rejectedJobs: 0, message: CONTAINER_STAGES[0].detail };
export const lifecycleTickMilliseconds = 1100;
export function getContainerStage(stage: ContainerStage) { return CONTAINER_STAGES.find((item) => item.id === stage)!; }
export function containerLifecycleReducer(state: ContainerLifecycleState, action: ContainerLifecycleAction): ContainerLifecycleState {
  switch (action.type) {
    case "play": return { ...state, playback: "running" };
    case "pause": return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "start-container":
      if (state.stage !== "created" && state.stage !== "stopped") return state;
      return { ...state, stage: "starting", message: getContainerStage("starting").detail };
    case "stop-container":
      if (state.stage === "created" || state.stage === "stopped") return state;
      return { ...state, stage: "stopped", message: getContainerStage("stopped").detail };
    case "submit-job":
      if (state.stage !== "ready") return { ...state, rejectedJobs: state.rejectedJobs + 1, message: `${getContainerStage(state.stage).label} では処理を受け付けません。Ready になるまで待ってください。` };
      return { ...state, stage: "processing", message: getContainerStage("processing").detail };
    case "restart-container":
      if (state.stage === "created" || state.stage === "restarting") return state;
      return { ...state, stage: "restarting", message: getContainerStage("restarting").detail };
    case "tick":
      if (state.playback !== "running") return state;
      if (state.stage === "starting") return { ...state, stage: "ready", message: getContainerStage("ready").detail };
      if (state.stage === "processing") return { ...state, stage: "ready", completedJobs: state.completedJobs + 1, message: "合成処理が完了し、次の処理を受け付けられます。" };
      if (state.stage === "restarting") return { ...state, stage: "starting", message: "再作成が完了し、起動処理へ進みました。" };
      return state;
    case "reset": return initialContainerLifecycleState;
  }
}
