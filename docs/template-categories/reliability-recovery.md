# Reliability & Recovery

## カテゴリの役割

Reliability & Recovery は、サービスやコンポーネントの障害を検知し、影響範囲を切り離し、代替経路や再試行へ切り替え、正常な提供状態へ戻すまでの時間変化を扱うテンプレートカテゴリである。

静的な構成や製品の機能一覧ではなく、「異常をどう判断し、どの保護動作を選び、いつ復旧したとみなすか」が主題となるシナリオを掲載する。実装方式やクラウドプロバイダーには依存しない。

## 掲載基準

次のいずれかを中心に、障害発生前から復旧完了までの判断や状態遷移を表現するテンプレートを掲載する。

- Health Check による異常の検知と判定
- Retry、Timeout、Circuit Breaker による障害の局所化
- 障害ノードや障害経路の切り離しと再参加
- Standby、別 Availability Zone、別 Region への Failover
- Replica の昇格と接続先の切り替え
- Multi-AZ / Multi-Region の災害復旧（DR）
- 復旧確認、トラフィックの段階的な復帰、通常運用への復帰

単に障害対応機能を含むだけでは掲載理由としない。シナリオの中心となる問いが「障害を受けて、サービス提供をどう継続または復旧するか」であることを掲載条件とする。

## 他カテゴリとの境界

1テンプレートには主カテゴリを1つだけ設定し、他の関心事は補助タグで表す。分類に迷う場合は、シナリオで利用者に観察させる主要な判断を基準にする。

| 主題 | 主カテゴリ | Reliability & Recovery の扱い |
| --- | --- | --- |
| 通常負荷に応じたインスタンス数の増減、配置、デプロイ | Compute & Scaling | 障害や復旧は補助タグまたは副次的なイベント |
| 障害検知後の再配置、代替インスタンスの起動、サービス復帰 | Reliability & Recovery | Compute / Scaling は復旧手段を示す補助タグ |
| Read / Write、Cache HIT / MISS、Replication、Backup などのデータ経路 | Data & Storage | 可用性は副次的な性質 |
| Primary 障害の判定、Replica 昇格、接続先切替、復旧確認 | Reliability & Recovery | Data / Storage は対象リソースを示す補助タグ |

たとえば「CPU 負荷で Pod が3個から6個へ増える」は Compute & Scaling、「Health Check 失敗後に別 AZ で Pod を再作成する」は Reliability & Recovery とする。「Primary から Replica へ継続的に複製する」は Data & Storage、「Primary 停止後に Replica を昇格して書き込みを再開する」は Reliability & Recovery とする。

## 主要な状態

状態名はベンダーニュートラルな概念として扱う。テンプレートは対象に応じて一部の状態だけを使用できるが、意味を別用途へ変更しない。

| 状態 | 意味 | 代表的な開始条件 |
| --- | --- | --- |
| `Healthy` | 正常性の基準を満たし、通常の処理対象である | 初期状態、復旧確認の完了 |
| `Warning` | 異常の兆候または一時的な失敗を検知したが、障害は未確定である | Health Check 失敗、Timeout、エラー率上昇 |
| `Down` | 正常性の基準を満たさず、処理を継続できないと判定された | 連続 Health Check 失敗、応答不能 |
| `Isolated` | 影響拡大を防ぐため、ルーティングや依存呼び出しから意図的に除外されている | Circuit Open、障害ノードの切り離し |
| `Promoting` | Standby / Replica を新しい処理主体へ切り替えている | Failover 判断、昇格開始 |
| `Recovered` | 修復後の確認を通過したが、通常処理への復帰途中である | Health Check 再成功、整合性確認完了 |

`Recovered` は復旧イベントを可視化するための一時状態であり、定常状態ではない。復帰条件を満たした後に `Healthy` へ移る。

## 基本遷移

```text
Healthy -> Warning -> Down -> Isolated -> Recovered -> Healthy
                       |          ^
                       v          |
                   Promoting -----+
```

- `Healthy -> Warning`: 最初の異常を検知する。単発の失敗だけで直ちに障害確定しない場合に使う。
- `Warning -> Healthy`: 再試行や次の Health Check が成功し、異常が一過性だと判断する。
- `Warning -> Down`: 失敗回数、Timeout、エラー率などの判定条件を超える。
- `Down -> Isolated`: 障害対象を経路や処理対象から除外し、影響を局所化する。
- `Down / Isolated -> Promoting`: 代替系を処理主体にする Failover を開始する。
- `Promoting -> Recovered`: 昇格と必要な接続切り替えが完了し、復旧確認に進む。
- `Isolated -> Recovered`: 元の対象を修復し、再参加前の確認を通過する。
- `Recovered -> Healthy`: 段階的なトラフィック復帰など、通常運用への復帰条件を満たす。
- 任意の復旧途中状態から `Down / Isolated`: 再検査の失敗時は、安全側へ戻す。

Retry や Timeout は状態そのものではなく、遷移を引き起こすイベントまたは判定材料として表現する。テンプレートごとに遷移条件、最大試行回数、待機時間などを説明し、暗黙の自動復旧にしない。

## テンプレート候補の分割単位

個別テンプレートの設計と実装は、このカテゴリ定義には含めず、次の候補ごとに別 Issue とする。

- Health Check と障害ノードの切り離し・再参加
- Timeout と上限付き Retry / Backoff
- Circuit Breaker の Closed / Open / Half-open
- Active / Standby の Multi-AZ Failover
- Primary 障害後の Replica 昇格
- Multi-Region DR と段階的な Failback

各 Issue には、主となる障害、検知条件、保護動作、復旧条件、利用する状態、操作可能な障害注入、非対象を明記する。複数の仕組みを一度に網羅せず、1つの復旧判断を学習・比較できる粒度に分割する。

## 制約と非対象

- 表現する時間、成功率、RTO、RPO は説明用の値であり、実環境の可用性や復旧目標を保証しない。
- Failure Injection はデモ内のシナリオ状態だけを変更し、実クラウドのリソースや通信へ作用させない。
- 実クラウドに対する Chaos Engineering、障害注入、Failover 操作は行わない。
- アラート受付、担当者割り当て、エスカレーションなどのインシデント管理システムは扱わない。
- このカテゴリ定義では個別テンプレートやプロバイダー固有機能を実装しない。
