export type DnsEndpoint = "primary" | "secondary";
export type DnsPhase = "ready" | "primary-success" | "stale-cache-failure" | "ttl-expired" | "record-updated" | "secondary-success";

export interface DnsScenarioState {
  playback: "idle" | "running" | "paused";
  primaryStatus: "healthy" | "down";
  authoritativeRecord: DnsEndpoint;
  cachedRecord: DnsEndpoint | null;
  ttlRemaining: number;
  requestStep: number;
  phase: DnsPhase;
  completedQueries: number;
}

export type DnsScenarioAction =
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "tick" }
  | { type: "fail-primary" }
  | { type: "expire-ttl" }
  | { type: "switch-record" };

export const DNS_TTL_SECONDS = 30;

export const initialDnsScenarioState: DnsScenarioState = {
  playback: "idle",
  primaryStatus: "healthy",
  authoritativeRecord: "primary",
  cachedRecord: "primary",
  ttlRemaining: DNS_TTL_SECONDS,
  requestStep: 0,
  phase: "ready",
  completedQueries: 0,
};

function resultPhase(endpoint: DnsEndpoint, primaryStatus: DnsScenarioState["primaryStatus"]): DnsPhase {
  if (endpoint === "secondary") return "secondary-success";
  return primaryStatus === "healthy" ? "primary-success" : "stale-cache-failure";
}

function tick(state: DnsScenarioState): DnsScenarioState {
  if (state.playback !== "running") return state;

  const nextStep = (state.requestStep + 1) % 4;
  const ttlRemaining = state.cachedRecord === null ? 0 : Math.max(0, state.ttlRemaining - 5);
  const cacheExpired = ttlRemaining === 0;
  let cachedRecord = cacheExpired ? null : state.cachedRecord;
  let phase: DnsPhase = cacheExpired ? "ttl-expired" : state.phase;
  let completedQueries = state.completedQueries;

  if (nextStep === 0) {
    cachedRecord = cachedRecord ?? state.authoritativeRecord;
    phase = resultPhase(cachedRecord, state.primaryStatus);
    completedQueries += 1;
    return { ...state, cachedRecord, ttlRemaining: DNS_TTL_SECONDS, requestStep: nextStep, phase, completedQueries };
  }

  return { ...state, cachedRecord, ttlRemaining, requestStep: nextStep, phase };
}

export function dnsScenarioReducer(state: DnsScenarioState, action: DnsScenarioAction): DnsScenarioState {
  switch (action.type) {
    case "start": return { ...state, playback: "running" };
    case "pause": return { ...state, playback: "paused" };
    case "reset": return initialDnsScenarioState;
    case "tick": return tick(state);
    case "fail-primary":
      return { ...state, primaryStatus: "down", phase: state.cachedRecord === "primary" ? "stale-cache-failure" : state.phase };
    case "expire-ttl":
      return { ...state, cachedRecord: null, ttlRemaining: 0, phase: "ttl-expired" };
    case "switch-record":
      return { ...state, authoritativeRecord: "secondary", phase: "record-updated" };
  }
}

export const phaseDescriptions: Record<DnsPhase, { title: string; detail: string }> = {
  ready: { title: "初期状態: Primary をキャッシュ中", detail: "Resolver は Primary の合成アドレスを保持しています。TTL は 30 秒です。" },
  "primary-success": { title: "正常完了: Primary へ接続", detail: "キャッシュされた名前解決結果を使い、Primary Endpoint へ到達しました。" },
  "stale-cache-failure": { title: "接続失敗: 古い Primary を参照", detail: "Primary は停止していますが、TTL が残るキャッシュは自動では Secondary に変わりません。" },
  "ttl-expired": { title: "境界状態: TTL 満了", detail: "キャッシュを破棄しました。次の問い合わせでは権威レコードを再取得します。" },
  "record-updated": { title: "レコード変更済み: Secondary", detail: "権威レコードは Secondary です。既存キャッシュが残る場合は、まだ Primary が使われます。" },
  "secondary-success": { title: "切り替え完了: Secondary へ接続", detail: "TTL 満了後の再問い合わせで Secondary を取得し、代替 Endpoint へ到達しました。" },
};
