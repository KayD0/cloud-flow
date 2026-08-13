# Observability & Operations

## カテゴリの役割

Observability & Operations は、システムが生成するシグナルを収集・集約・相関し、異常の把握、Alert の発火、運用者の判断や通知へつなげる流れを扱うカテゴリです。

静的な監視構成の紹介ではなく、Metrics、Logs、Traces がどこで生まれ、Telemetry Collector などを経由してどのように可視化・評価され、運用上のアクションへつながるかを動きとして表現します。

## 掲載基準

次のいずれかを主題とするテンプレートを掲載します。

- アプリケーション、ホスト、ネットワークなどからの Metrics、Logs、Traces の生成
- Agent や Telemetry Collector によるシグナルの収集、変換、バッチ化、転送
- バックエンドでの集約と、複数シグナルのサービス・リクエスト単位での相関
- Dashboard による状態や傾向の可視化
- SLI の計測、SLO に対する評価、エラーバジェットの把握
- 閾値、異常、SLO 違反などを条件とした Alert の発火
- Alert のルーティング、抑制、集約と Incident Notification による運用者への通知

製品固有の画面操作ではなく、ベンダーニュートラルな役割とデータフローを説明できることを掲載条件とします。

## 主な構成要素

| 構成要素 | このカテゴリで表現する役割 |
| --- | --- |
| Metrics | 数値の時系列シグナルを生成し、集約や閾値評価へ渡す |
| Logs | イベントの記録を生成し、サービスや時刻などの文脈とともに転送する |
| Traces | リクエストをまたぐ Span を生成し、処理経路や遅延を相関する |
| Telemetry Collector | シグナルを受信、変換、サンプリング、バッチ化して転送する |
| Observability Backend | シグナルを集約し、可視化や評価に利用できる状態にする |
| Dashboard | 現在の状態、傾向、関連するシグナルを運用者に提示する |
| SLO / Alert Rule | 目標や条件に照らしてシグナルを評価し、Alert の要否を決める |
| Alert Router | 重複排除、抑制、グルーピングを行い通知先を選択する |
| Incident Notification | 運用者へ異常の発生と判断に必要な文脈を伝える |

## Signal から Alert までの主要な動き

基本フローは次の通りです。テンプレートは、この一部または全体を目的に応じて表現します。

1. **生成**: アプリケーションやインフラが Metrics、Logs、Traces を生成する。
2. **収集**: Agent または Telemetry Collector がシグナルを受け取る。
3. **処理・転送**: 属性付与、フィルタリング、サンプリング、バッチ化などを行い、バックエンドへ転送する。
4. **集約・相関**: サービス、時刻、リクエスト、Trace ID などの文脈でシグナルをまとめ、相互に関連付ける。
5. **可視化・評価**: Dashboard へ状態を反映し、閾値、異常検知、SLI / SLO などのルールで評価する。
6. **Alert 発火**: 条件を満たした評価結果から Alert を生成する。
7. **通知**: Alert Router が重複排除、抑制、グルーピング、ルーティングを行い、Incident Notification として運用者へ届ける。
8. **運用判断**: 運用者が関連シグナルを確認し、調査、エスカレーション、復旧判断へ進む。

このカテゴリのテンプレートが表す通知はデモ内部の状態遷移までとし、外部サービスへの実通知は行いません。

## 他カテゴリとの境界

### Reliability & Recovery

分類は「何を検知するか」ではなく「テンプレートが何を理解させるか」で決めます。

- Signal の生成、収集、相関、可視化、Alert、運用者への通知や判断が主題なら **Observability & Operations** を主カテゴリとする。
- 障害の切り離し、Retry、Circuit Breaker、Failover、Replica 昇格、復旧など、システム側の障害対応と状態遷移が主題なら **Reliability & Recovery** を主カテゴリとする。
- 検知後に自動復旧する一連の流れでは、学習の中心が Alert までなら Observability & Operations、復旧動作なら Reliability & Recovery とし、もう一方は補助タグで表す。
- 運用者が通知を受けて調査を開始するところまでは本カテゴリに含むが、実際の復旧手順やインシデント管理ワークフローは含めない。

例:

| シナリオ | 主カテゴリ | 理由 |
| --- | --- | --- |
| サービスの Metrics を集約し、SLO 違反で Alert を発火する | Observability & Operations | シグナルの評価と通知が主題 |
| Trace と Logs を相関して遅延箇所を特定する | Observability & Operations | 調査に至る相関が主題 |
| Health Check 失敗後に待機系へ Failover する | Reliability & Recovery | 障害後の復旧動作が主題 |
| Alert を契機に自動で Replica を昇格する | Reliability & Recovery | Alert は契機であり、昇格と復旧が主題 |

## 制約

- シグナルには架空または合成したデータだけを使い、実監視データや個人情報を取り込まない。
- ベンダーニュートラルな概念図と動きを扱い、監視製品の管理画面を再現しない。
- シークレット、認証情報、実在する通知先を要求しない。
- 表示する Alert や Incident Notification は学習用デモであり、実環境の健全性や SLO 達成を保証しない。

## 非対象

- メール、チャット、電話、Pager などへの実アラート通知
- 実運用向けのログ検索・分析基盤
- インシデント管理システムやオンコール体制の実装
- 個別テンプレートの Scenario や UI の実装
- 実環境からの Telemetry 取り込み

## 個別テンプレート候補

候補はそれぞれ別 Issue とし、このカテゴリ定義には実装を含めません。

| Issue 候補 | 主に扱う流れ | 最小スコープ |
| --- | --- | --- |
| Metrics Pipeline | Metrics の生成 → 収集 → 集約 → Dashboard | Counter / Gauge、Collector、時系列集約、可視化 |
| Logs Pipeline | Logs の生成 → 収集 → 構造化 → 集約 | 複数サービス、属性付与、フィルタリング、転送 |
| Distributed Tracing | Span の生成 → Collector → Trace の相関 | 親子 Span、サービス間伝播、遅延箇所の表示 |
| Three Pillars Correlation | Metrics の異常 → Trace → 関連 Logs | 共通のサービス・時刻・Trace ID による相関 |
| SLO and Error Budget Alert | SLI 計測 → SLO 評価 → Alert | 目標値、エラーバジェット消費、Alert 状態 |
| Alert Routing and Suppression | Alert 発火 → 集約・抑制 → Incident Notification | 重複排除、グルーピング、通知先ルーティング |
| Telemetry Sampling and Backpressure | Signal → Collector の処理 → Backend | サンプリング、バッチ化、キュー詰まり、ドロップ表示 |

各 Issue では、対象シグナル、開始状態と終了状態、利用者が操作できる項目、表現する動き、非対象、受け入れ条件を個別に定義します。
