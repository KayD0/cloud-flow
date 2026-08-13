# Compute & Scaling

## カテゴリの役割

Compute & Scaling は、アプリケーションやジョブを実行する基盤と、需要やデプロイに応じて実行単位の数・配置・世代が時間とともに変化する様子を扱うカテゴリである。

Server / VM、Container、Pod、Node、Cluster、Function を主要な対象概念とし、Auto Scaling、再配置、Rolling Update など、実行能力を維持または変更する動きを表現する。クラウド製品固有の管理画面や正確な性能予測ではなく、ベンダーニュートラルな概念と状態遷移の理解を目的とする。

## 掲載基準

次をすべて満たすテンプレートを掲載する。

- 主題が、実行基盤のライフサイクル、処理、配置、台数変更、または世代更新である
- Server / VM、Container、Pod、Node、Cluster、Function のいずれかを主要な実行単位として扱う
- 起動や停止、処理、スケール、再配置、デプロイのうち、少なくとも1つの時間変化を視覚化する
- 実サービスの操作や性能保証ではなく、構成と挙動を説明するシナリオである

負荷、ヘルスチェック、障害、通信、キューなどは、実行単位の変化を引き起こす入力や補助タグとして含められる。ただし、それら自体が説明の中心なら対応する別カテゴリを主カテゴリとする。

## Reliability & Recovery との境界

主カテゴリは「シナリオで利用者に理解してほしい判断」によって決める。

| 主題 | 主カテゴリ | 例 |
| --- | --- | --- |
| 平常時の需要変化に応じて実行数を増減する | Compute & Scaling | CPU 負荷を契機としたスケールアウト / イン |
| 新しい世代へ段階的に置き換える | Compute & Scaling | Pod の Rolling Update |
| 実行場所や容量を調整する | Compute & Scaling | Node 間の Pod 再配置、Function の同時実行数変化 |
| 障害を検知し、復旧方法を判断・実行する | Reliability & Recovery | 異常 Node からの退避、障害後の再作成 |
| 冗長化、フェイルオーバー、復旧目標を説明する | Reliability & Recovery | Standby への切り替え、Multi-AZ 復旧 |

同じ動きに障害が含まれていても、台数や配置の変化が主題なら Compute & Scaling、障害からどのように回復するかの判断が主題なら Reliability & Recovery とする。副次的な概念は補助タグで表し、主カテゴリを重複させない。

## 表現対象となる状態遷移

状態名はテンプレート間で概念を共有するための語彙であり、実際のクラウド製品の状態を厳密に再現するものではない。

| 動き | 基本遷移 | 表現する内容 |
| --- | --- | --- |
| 起動 | `pending -> starting -> ready` | 実行単位が作成され、処理可能になるまで |
| 停止 | `ready / processing -> stopping -> stopped` | 受付停止、処理終了、実行単位の停止 |
| 処理 | `ready -> processing -> ready` | リクエストやジョブを処理している時間変化 |
| スケールアウト | `capacity-reached -> scaling-out -> ready` | 需要増加を契機に実行単位を追加する |
| スケールイン | `under-utilized -> draining -> terminating` | 需要減少後に処理を退避し、実行単位を減らす |
| 再配置 | `scheduled -> moving -> starting -> ready` | 実行単位を別の Node や配置先へ移す |
| デプロイ | `current -> updating -> current / retired` | 新世代を追加し、旧世代を段階的に置き換える |

テンプレートは必要な遷移だけを採用し、開始条件、変化中の状態、完了条件を明示する。スケールインや更新では、処理中の実行単位を直ちに消すのではなく、draining などの中間状態を使って時間変化を示せる。

## 個別テンプレート候補

各候補は独立した Issue とし、対象となる実行方式、学習目的、開始条件、状態遷移、操作、受け入れ条件を定義する。

| Issue 候補 | 主な対象 | 中心となる動き |
| --- | --- | --- |
| VM Auto Scaling | Server / VM、Auto Scaling Group | 負荷増減に応じた起動、スケールアウト / イン、停止 |
| Container Lifecycle | Container、Host | 作成、起動、処理、停止、再起動 |
| Kubernetes Pod Scheduling | Pod、Node、Cluster | Scheduling、起動、処理、Node 間の再配置 |
| Kubernetes Rolling Update | Deployment、ReplicaSet、Pod | 新旧世代の段階的な追加、draining、置き換え |
| Serverless Function Scaling | Function、Invocation | 呼び出し増加、同時実行数の増減、アイドル化 |
| Cluster Node Scaling | Node、Cluster、Pod | Node の追加、Pod 配置、draining、Node の削減 |

候補 Issue では、実行方式ごとの差が学習上重要になるため、複数方式を1つの汎用テンプレートにまとめない。

## 制約・非対象

- Kubernetes 管理画面やデプロイツールは作らない
- 実際の CPU 使用率、起動時間、スケーリング性能、費用を保証するシミュレーションにしない
- IaC を生成しない
- 実クラスタやクラウド環境を操作しない
- このカテゴリ定義では個別テンプレートを実装しない
