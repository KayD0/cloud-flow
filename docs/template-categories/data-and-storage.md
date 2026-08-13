# Data & Storage

Data & Storage は、アプリケーションがデータを保存、取得、複製し、用途に応じて保存先を使い分ける流れを扱うテンプレートカテゴリである。

## 掲載基準

次のいずれかがシナリオの主題であるテンプレートを掲載する。

- Relational Database / NoSQL Database に対する読み書き
- Cache を介したデータ取得と Cache HIT / MISS
- Object Storage / Block Storage / File Storage への保存と取得
- Primary から Read Replica への複製と読み取りの分散
- Backup の作成、保持、Restore によるデータの復元
- アクセス頻度や保存期間に応じたデータ階層化

実製品の挙動を再現するのではなく、保存先の役割、データの向き、同期・非同期、永続化の違いをベンダーニュートラルに理解できることを重視する。

## 主要な動き

| 動き | 表現する内容 |
| --- | --- |
| Read | アプリケーションまたは利用者が保存先からデータを取得する |
| Write | データを保存先へ書き込み、必要に応じて結果を返す |
| Cache HIT | Cache からデータを返し、下位の永続ストアへのアクセスを省く |
| Cache MISS | Cache にないデータを永続ストアから取得し、必要に応じて Cache を更新する |
| Replication | Primary から Replica へデータを複製する。同期・非同期の違いは概念として表示できる |
| Backup | 現在のデータを別の保存先または世代へ退避する |
| Restore | Backup から対象の保存先へデータを戻す |
| Tiering | アクセス頻度や経過時間に応じてデータを異なるストレージ階層へ移す |

Read / Write は方向の違いが分かるラベルまたは視覚表現を持たせる。Replication、Backup、Restore は同じ「データの移動」でも目的が異なるため、動きの名称と開始元・到達先を明示する。

## 他カテゴリとの境界

テンプレートには主カテゴリを一つだけ設定し、複数の関心事を含む場合は補助タグで表す。分類は登場するコンポーネントではなく、利用者が観察・操作する中心的な判断で決める。

### Reliability & Recovery との境界

- 通常時の Read / Write、Cache、Replication、Backup、Restore、データ階層化など、データ経路や保存方式の違いが主題なら Data & Storage とする。
- Primary 障害の検知、Replica の昇格、Failover、復旧状態、RTO / RPO の判断など、障害後の可用性判断が主題なら Reliability & Recovery とする。
- 例えば「Primary から Read Replica への複製と読み取り分散」は Data & Storage、「Primary 障害後に Replica を昇格して通信を切り替える」は Reliability & Recovery とする。

### その他のカテゴリとの境界

- 保存先の負荷に応じたインスタンス数や容量の増減が主題なら Compute & Scaling とする。
- Queue や Event Bus を介したサービス間連携が主題なら Messaging & Integration とする。連携の結果としてデータを保存するだけでは Data & Storage にしない。
- 暗号化、アクセス制御、監査が主題なら Security とする。
- メトリクス、ログ、トレースによるデータ基盤の監視が主題なら Observability & Operations とする。

## 表現上の制約

- 実データの保存、同期、移行は行わない。
- 実 Database の性能、トランザクション、整合性モデルを厳密には再現しない。
- ベンダー固有機能を網羅せず、必要な場合は Provider などの補助タグで扱う。
- データ移行ツール、SQL クライアント、汎用ストレージ管理 UI は作らない。

## 個別テンプレート候補

個別テンプレートの内容と実装は、このカテゴリ定義とは別の Issue で管理する。候補は、1 Issue につき一つの主な学習目的とシナリオに分割する。

- Database Read / Write
- Cache HIT / MISS
- Primary と Read Replica
- Object / Block / File Storage の使い分け
- Backup / Restore
- Hot / Cool / Archive へのデータ階層化

各 Issue では、対象概念、開始状態、主要な動き、利用者が操作できる項目、完了状態を明記する。障害検知や昇格を中心にする候補は Reliability & Recovery の Issue として作成する。
