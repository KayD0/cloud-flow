export type DnsEndpoint = "primary" | "secondary";
export type DnsMode = "guided" | "challenge";
export type DnsOutcome = "playing" | "won" | "lost";
export type DnsActionName = "inject-failure" | "advance-ttl" | "failover" | "connect";

export interface DnsFeedback {
  kind: "info" | "success" | "warning" | "failure";
  title: string;
  detail: string;
}

export interface DnsScenarioState {
  playback: "idle" | "running" | "paused";
  mode: DnsMode;
  outcome: DnsOutcome;
  primaryStatus: "healthy" | "down";
  authoritativeRecord: DnsEndpoint;
  cachedRecord: DnsEndpoint | null;
  ttlRemaining: number;
  attempts: number;
  failedConnections: number;
  actionsTaken: number;
  feedback: DnsFeedback;
}

export type DnsScenarioAction =
  | { type: "start"; mode: DnsMode }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "inject-failure" }
  | { type: "advance-ttl" }
  | { type: "failover" }
  | { type: "connect" };

export const DNS_TTL_SECONDS = 30;
export const TTL_STEP_SECONDS = 10;
export const MAX_FAILED_CONNECTIONS = 3;

const readyFeedback: DnsFeedback = {
  kind: "info",
  title: "救助ミッション待機中",
  detail: "モードを選び、開始してください。すべての値は説明用の合成データです。",
};

export const initialDnsScenarioState: DnsScenarioState = {
  playback: "idle",
  mode: "guided",
  outcome: "playing",
  primaryStatus: "healthy",
  authoritativeRecord: "primary",
  cachedRecord: "primary",
  ttlRemaining: DNS_TTL_SECONDS,
  attempts: 0,
  failedConnections: 0,
  actionsTaken: 0,
  feedback: readyFeedback,
};

function isPlayable(state: DnsScenarioState) {
  return state.playback === "running" && state.outcome === "playing";
}

function withAction(state: DnsScenarioState, changes: Partial<DnsScenarioState>): DnsScenarioState {
  return { ...state, ...changes, actionsTaken: state.actionsTaken + 1 };
}

export function dnsScenarioReducer(state: DnsScenarioState, action: DnsScenarioAction): DnsScenarioState {
  switch (action.type) {
    case "start":
      if (state.outcome !== "playing") return state;
      return {
        ...state,
        mode: action.mode,
        playback: "running",
        feedback: {
          kind: "info",
          title: action.mode === "guided" ? "ガイド開始: まず障害を注入" : "チャレンジ開始",
          detail: "Primary は現在正常です。障害を発生させ、通信を Secondary へ安全に切り替えてください。",
        },
      };
    case "pause":
      return state.playback === "running" ? { ...state, playback: "paused" } : state;
    case "reset":
      return initialDnsScenarioState;
    case "inject-failure":
      if (!isPlayable(state) || state.primaryStatus === "down") return state;
      return withAction(state, {
        primaryStatus: "down",
        feedback: {
          kind: "warning",
          title: "Primary が到達不能になりました",
          detail: "Resolver のキャッシュにはまだ Primary が残っています。権威 DNS を切り替えても、TTL が切れるまでは古い宛先が使われます。",
        },
      });
    case "advance-ttl": {
      if (!isPlayable(state) || state.cachedRecord === null) return state;
      const ttlRemaining = Math.max(0, state.ttlRemaining - TTL_STEP_SECONDS);
      const expired = ttlRemaining === 0;
      return withAction(state, {
        ttlRemaining,
        cachedRecord: expired ? null : state.cachedRecord,
        feedback: expired
          ? {
              kind: "success",
              title: "TTL が満了し、キャッシュを破棄しました",
              detail: "次の名前解決では権威 DNS の最新レコードを取得します。TTL は変更の反映速度と問い合わせ量のトレードオフです。",
            }
          : {
              kind: "info",
              title: `TTL を ${TTL_STEP_SECONDS} 秒進めました`,
              detail: `残り ${ttlRemaining} 秒の間、Resolver は ${state.cachedRecord === "primary" ? "Primary" : "Secondary"} を返します。`,
            },
      });
    }
    case "failover":
      if (!isPlayable(state) || state.authoritativeRecord === "secondary") return state;
      return withAction(state, {
        authoritativeRecord: "secondary",
        feedback: {
          kind: state.primaryStatus === "down" ? "success" : "warning",
          title: "権威 DNS を Secondary へ切り替えました",
          detail: state.cachedRecord === null
            ? "キャッシュは空です。次の名前解決から Secondary が返ります。"
            : "権威レコードは更新済みですが、Resolver のキャッシュは TTL 満了まで変わりません。",
        },
      });
    case "connect": {
      if (!isPlayable(state)) return state;
      const resolved = state.cachedRecord ?? state.authoritativeRecord;
      const reachable = resolved === "secondary" || state.primaryStatus === "healthy";
      if (reachable) {
        const rescued = state.primaryStatus === "down" && resolved === "secondary";
        return withAction(state, {
          cachedRecord: resolved,
          ttlRemaining: state.cachedRecord === null ? DNS_TTL_SECONDS : state.ttlRemaining,
          attempts: state.attempts + 1,
          outcome: rescued ? "won" : state.outcome,
          playback: rescued ? "paused" : state.playback,
          feedback: rescued
            ? { kind: "success", title: "通信復旧 — ミッション成功", detail: "TTL 満了後の再解決で Secondary を取得し、到達可能な Endpoint へ接続できました。" }
            : { kind: "info", title: "Primary への通常通信に成功", detail: "正常系を確認しました。次は Primary 障害を注入して復旧判断を始めてください。" },
        });
      }

      const failedConnections = state.failedConnections + 1;
      const lost = failedConnections >= MAX_FAILED_CONNECTIONS;
      return withAction(state, {
        cachedRecord: resolved,
        ttlRemaining: state.cachedRecord === null ? DNS_TTL_SECONDS : state.ttlRemaining,
        attempts: state.attempts + 1,
        failedConnections,
        outcome: lost ? "lost" : state.outcome,
        playback: lost ? "paused" : state.playback,
        feedback: {
          kind: "failure",
          title: lost ? "ミッション失敗: 到達不能が続きました" : "接続失敗: 古い Primary を参照しています",
          detail: state.authoritativeRecord === "secondary"
            ? "権威 DNS は切替済みでも、TTL が残るキャッシュは Primary を返します。TTL を満了させてから再接続してください。"
            : "Primary は停止中です。権威 DNS を Secondary へ切り替え、TTL キャッシュの影響も解消してください。",
        },
      });
    }
  }
}

export function getGuidedNextAction(state: DnsScenarioState): DnsActionName | null {
  if (state.outcome !== "playing") return null;
  if (state.primaryStatus === "healthy") return "inject-failure";
  if (state.authoritativeRecord === "primary") return "failover";
  if (state.cachedRecord !== null) return "advance-ttl";
  return "connect";
}

export function getChallengeScore(state: DnsScenarioState) {
  const accuracy = Math.max(0, 40 - state.failedConnections * 15);
  const availability = state.outcome === "won" ? Math.max(10, 40 - state.failedConnections * 10) : 0;
  const safety = Math.max(0, 20 - Math.max(0, state.actionsTaken - 6) * 2);
  return { accuracy, availability, safety, total: accuracy + availability + safety };
}
