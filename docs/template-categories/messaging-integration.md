# Messaging & Integration

Messaging & Integration は、送信側と受信側を時間的に分離する非同期通信と、その間でメッセージが蓄積、配送、再試行される動きを扱うテンプレートカテゴリである。

Queue、Topic、Pub/Sub、Event Bus、Stream、Producer / Consumer、Webhook を代表概念とする。個別製品ではなく、メッセージの寿命と配送規則をベンダーニュートラルに学べることを掲載基準とする。

## 掲載基準

次のいずれかがテンプレートの主題である場合、このカテゴリを主カテゴリとする。

- Producer がメッセージを Queue、Topic、Event Bus、Stream へ発行し、Consumer が非同期に受信する
- Enqueue / Dequeue、Fan-out、Batch、Retry、Dead Letter Queue、Backpressure によってメッセージの状態や配送先が変化する
- Consumer の停止や処理能力の差によって滞留量、再試行回数、処理の進み方が変化する
- Webhook の配信結果に応じて再送、成功、破棄などの状態が変化する

単にコンポーネント間を矢印で接続するだけの構成や、非同期通信が補助的に登場するだけのテンプレートは掲載しない。主カテゴリは1つとし、横断的な概念は補助タグで表す。

## Traffic & Routing との境界

分類は通信プロトコルの名前ではなく、利用者が観察・操作する中心的な動きで決める。

| 主題 | 主カテゴリ | 判断理由 |
| --- | --- | --- |
| 同期 Request / Response の経路選択、転送、負荷分散 | Traffic & Routing | リクエストが今どこを通り、どこへ振り分けられるかが中心 |
| Producer と Consumer の間の滞留、非同期配送、再試行 | Messaging & Integration | 送受信の時間的分離とメッセージの寿命が中心 |
| Gateway が同期リクエストをバックエンドへルーティング | Traffic & Routing | Gateway は登場しても、主題は同期的な Request Routing |
| Gateway が受け付けた処理を Queue に蓄積し、後で Consumer が処理 | Messaging & Integration | Queue 以降の蓄積と非同期処理が中心 |
| Webhook の送信先選択だけを示す | Traffic & Routing | 経路や配送先の選択が中心 |
| Webhook の失敗、再送、打ち切り、Dead Letter 化を示す | Messaging & Integration | 配送結果に伴う状態遷移と再試行が中心 |

両方の要素を持つ場合も主カテゴリを重複させない。同期経路の判断が学習目的なら Traffic & Routing、受け付け後の蓄積・配送・再試行が学習目的なら Messaging & Integration とし、もう一方は補助タグにする。

## 視覚表現

表現は厳密なブローカーシミュレーションではなく、概念上の状態変化を一貫して読めることを目的とする。

### 蓄積

- Queue / Stream 内のメッセージを、順序の分かるトークン列または件数として表示する
- Enqueue では Producer から蓄積領域へトークンを移動し、Dequeue では先頭または現在位置から Consumer へ移動する
- 滞留量は Queue の長さ、件数、使用率などで表し、Backpressure 発生時は警告状態と流入抑制を色以外のラベルや記号でも示す
- Stream では Consumer ごとの読み取り位置をカーソルとして表示し、Queue の「取り出すと消える」表現と区別する

### 配送

- Point-to-point は1つのメッセージが1つの Consumer に渡る経路として表示する
- Fan-out は1つの発行を起点に、購読先ごとの配送トークンへ分岐して表示する
- Batch は複数トークンを枠でまとめ、1回の配送単位として移動させる
- 配送中、処理中、完了、失敗を状態として区別し、速度変更や一時停止でも現在位置を追えるようにする

### 再試行

- 失敗した配送は元のメッセージとの同一性を保ったまま Retry 経路へ移し、試行回数と次回試行までの待機を表示する
- Retry は通常配送と異なる戻り経路または待機領域で示し、無限ループに見えないよう最大試行回数を明示する
- 上限到達後は Dead Letter Queue へ移動し、失敗理由と再処理可能な状態であることを表示する
- Reset では概念上の初期状態に戻す。実データの永続性や配送保証を再現するものとは扱わない

## 想定する操作

- Start / Pause / Reset と再生速度の変更
- Producer の発行量、Consumer の処理量、Batch サイズの変更
- Consumer の停止 / 復旧と購読先の有効 / 無効の切り替え
- 配送失敗の注入、Retry 上限の変更、Dead Letter の再処理
- 滞留量、処理済み件数、失敗件数、Consumer lag の確認

これらはテンプレートごとに必要なものだけを採用し、厳密なスループット、レイテンシ、順序保証、At-most-once / At-least-once / Exactly-once などの配送保証はシミュレーションしない。実メッセージブローカーにも接続しない。

## 個別 Issue 候補

各候補は独立した個別テンプレート Issue として作成できる単位にする。

| 候補 | 中心となる動き | 最小操作 | 補助タグ候補 |
| --- | --- | --- | --- |
| Work Queue | Enqueue、競合 Consumer への Dequeue、滞留 | 発行量、Consumer 停止 / 復旧 | queue, backpressure |
| Pub/Sub Fan-out | Topic への Publish、複数 Subscriber への配送 | 購読の有効 / 無効 | topic, fan-out |
| Event Bus Routing | イベント属性による非同期の振り分け | ルール切り替え、イベント投入 | event-bus, filtering |
| Stream Consumer Lag | 追記、Consumer ごとの読み取り、Lag 増減 | 発行量、処理量 | stream, consumer-lag |
| Batch Consumer | 蓄積、Batch 形成、一括処理 | Batch サイズ、処理開始 | batch, queue |
| Retry and Dead Letter Queue | 配送失敗、待機、再試行、DLQ 移動 | 失敗注入、Retry 上限、再処理 | retry, dlq |
| Backpressure | Producer と Consumer の速度差、流入抑制 | 発行量、処理量、上限 | backpressure, queue |
| Webhook Delivery | 外部宛て配送、失敗、再送、打ち切り | 応答結果、Retry 上限 | webhook, retry |

個別 Issue では、学習目的、初期状態、状態遷移、操作、完了条件を定義する。このカテゴリ仕様では個別 Scenario の実装、ワークフローエンジン、イベントスキーマ管理を扱わない。

