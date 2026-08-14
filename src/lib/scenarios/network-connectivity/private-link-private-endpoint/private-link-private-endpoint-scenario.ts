export type PlaybackState = "idle" | "running" | "paused" | "completed";
export type RouteOutcome = "waiting" | "private" | "public" | "blocked";

export interface PrivateEndpointState {
  playback: PlaybackState;
  endpointEnabled: boolean;
  comparePublicRoute: boolean;
  step: 0 | 1 | 2 | 3;
  outcome: RouteOutcome;
}

export type PrivateEndpointAction =
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "tick" }
  | { type: "set-endpoint"; enabled: boolean }
  | { type: "set-public-comparison"; enabled: boolean };

export const initialPrivateEndpointState: PrivateEndpointState = {
  playback: "idle",
  endpointEnabled: true,
  comparePublicRoute: false,
  step: 0,
  outcome: "waiting",
};

function restartWith(state: PrivateEndpointState, change: Partial<PrivateEndpointState>): PrivateEndpointState {
  return { ...state, ...change, playback: "idle", step: 0, outcome: "waiting" };
}

export function privateEndpointReducer(state: PrivateEndpointState, action: PrivateEndpointAction): PrivateEndpointState {
  switch (action.type) {
    case "start":
      return state.playback === "completed"
        ? { ...state, playback: "running", step: 0, outcome: "waiting" }
        : { ...state, playback: "running" };
    case "pause":
      return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "reset":
      return initialPrivateEndpointState;
    case "set-endpoint":
      return restartWith(state, { endpointEnabled: action.enabled });
    case "set-public-comparison":
      return restartWith(state, { comparePublicRoute: action.enabled });
    case "tick": {
      if (state.playback !== "running") return state;
      if (state.step < 2) return { ...state, step: (state.step + 1) as 1 | 2 };
      const outcome: RouteOutcome = state.endpointEnabled
        ? "private"
        : state.comparePublicRoute ? "public" : "blocked";
      return { ...state, step: 3, outcome, playback: "completed" };
    }
  }
}

export function getStateExplanation(state: PrivateEndpointState): string {
  if (state.outcome === "private") return "Private Endpoint が有効なため、通信は Public Internet を通らず Managed Service に到達しました。";
  if (state.outcome === "public") return "Private Endpoint は無効です。比較用の Public 経路を使うため到達できますが、通信は公開境界を通ります。";
  if (state.outcome === "blocked") return "Private Endpoint が無効で Public 経路も許可していないため、公開境界の手前で通信を遮断しました。";
  if (state.playback === "paused") return "一時停止中です。Start で現在の位置から再開できます。";
  if (state.step === 2) return "経路を判定中です。Private Endpoint の状態を確認しています。";
  if (state.step === 1) return "Private Subnet から合成リクエストを送信しています。";
  return "初期状態です。設定を選び、Start で合成リクエストを開始してください。";
}
