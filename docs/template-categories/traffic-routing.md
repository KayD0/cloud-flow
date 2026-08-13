# Traffic & Routing

## カテゴリの説明

Traffic & Routing は、リクエストが送信元から送信先までどの経路を通り、どのルールや判断によって配送、分岐、拒否されるかを学ぶためのテンプレートカテゴリである。

静的なネットワーク構造ではなく、通信の流れと配送判断、その結果として返るレスポンスの時間変化を主題とする。特定クラウドの製品仕様には依存せず、複数の環境に共通する概念を扱う。

## 代表概念

- Request / Response
- Load Balancing
- Path-based / Host-based Routing
- Gateway
- DNS resolution
- CDN and edge delivery
- Forward / Reverse Proxy
- Redirect and rewrite
- Health check に基づく配送先の除外
- Timeout、拒否、到達不能などの配送結果

これらの要素が登場するだけでは本カテゴリに分類しない。テンプレートの中心的な問いが「通信がどこへ、なぜ配送されたか」であることを掲載条件とする。

## 掲載基準

次の条件を満たすテンプレートを Traffic & Routing の候補とする。

1. Request、Response、または同等のトラフィック単位が経路上を移動する。
2. 経路または配送先を決めるルールや判断を観察できる。
3. 分岐、転送、応答、遅延、拒否のいずれかを時間変化として表現できる。
4. 学習目標を特定クラウド固有のロードバランサーやゲートウェイの仕様に固定しない。

実パケット、プロトコルスタック、輻輳制御を厳密に再現することは掲載条件に含めない。学習に必要な範囲で抽象化されたリクエストと経路を扱う。

## Network & Connectivity との境界

分類は、図に含まれるリソースの種類ではなく、テンプレートの主題と学習者が操作・観察する対象で決める。

| 判断軸 | Traffic & Routing | Network & Connectivity |
| --- | --- | --- |
| 中心的な問い | リクエストはどこへ、どのルールで配送されるか | リソース同士はどのネットワーク構造で接続されるか |
| 主な観察対象 | Request / Response、経路選択、分岐、配送結果 | VPC / VNet、Subnet、Peering、接続境界、到達関係 |
| 主な時間変化 | 転送、応答、遅延、拒否、配送先の切り替え | 接続の確立・切断、到達可能性の変化 |
| 代表的な操作 | トラフィック量やルールの変更、障害注入、再送 | 接続、経路、境界、ネットワーク構成の変更 |

例えば VPC と Subnet の中に Load Balancer が描かれていても、配送ルールによるリクエストの振り分けが主題なら Traffic & Routing とする。一方、ロードバランサーが登場しても、Public / Private Subnet の境界や Peering 後の到達可能性が主題なら Network & Connectivity とする。

両方の観点を含む場合は、タイトル、説明、主要操作、成功条件の過半がどちらの問いに答えるかで主カテゴリを決める。もう一方は補助タグとして扱い、二重登録はしない。

## 想定する動き

- Request が Client から Gateway、Proxy、Load Balancer などを経由して送信先へ進む。
- Routing rule に一致した経路または配送先が強調され、非選択経路と区別される。
- 複数の配送先へ Round Robin、重み、属性などに応じて Request が分岐する。
- Response が Request と逆向き、または定義された戻り経路を通って返る。
- DNS 解決、Redirect、Cache HIT / MISS などにより次の経路が決まる。
- 遅延、Timeout、拒否、到達不能が経路上の状態と結果として表現される。
- Health check や障害によって配送先が候補から外れ、回復後に戻る。

動きは概念的な状態遷移として表現し、実パケットの送受信タイミングや特定製品の内部アルゴリズムとの一致は保証しない。

## 想定する操作

- 再生、一時停止、リセット、ステップ実行
- 再生速度とトラフィック量の変更
- Routing rule、重み、優先順位、配送方式の変更
- Request の host、path、region など配送判断に使う属性の変更
- 配送先、Gateway、Proxy、経路への障害注入と回復
- 遅延、Timeout、拒否、Cache HIT / MISS の切り替え
- 選択された経路や配送判断の根拠の確認

個別テンプレートは、学習目標に必要な操作だけを採用する。すべての操作を共通要件にはしない。

## 個別 Issue へ分割するテンプレート候補

以下は掲載候補であり、このカテゴリ定義には実装を含めない。候補ごとに独立した Issue を作り、学習目標、開始状態、状態遷移、操作、完了条件を具体化する。

| 候補 | 主な学習目標 | 中心となる動き・判断 |
| --- | --- | --- |
| Request / Response Flow | 基本的な往復通信を理解する | Request の転送と Response の返却 |
| Round Robin Load Balancing | 複数の正常な配送先への均等な振り分けを理解する | 順番による選択、障害中の配送先の除外 |
| Weighted Routing | 配送比率による段階的なリリースを理解する | 重みに基づく分岐 |
| Host / Path-based Routing | Request 属性による配送先の違いを理解する | host / path rule の評価と分岐 |
| API Gateway Request Flow | Gateway での検証とバックエンド配送を理解する | 許可、拒否、転送 |
| DNS Resolution and Failover | 名前解決結果と切り替えを理解する | 解決、TTL による遅延、代替先への変更 |
| CDN Cache Routing | Edge cache の有無による経路差を理解する | Cache HIT / MISS と Origin への転送 |
| Reverse Proxy and Timeout | Proxy を介した転送と失敗結果を理解する | 転送、遅延、Timeout、エラー応答 |
| Redirect and Rewrite | URL 変更と内部経路変更の違いを理解する | Redirect response と内部 rewrite |

### 分割時の確認事項

個別 Issue では少なくとも次を決める。

- 一つの明確な学習目標
- 開始ノード、経由ノード、配送先と接続
- 配送判断に使う vendor-neutral なルール
- 正常系と、必要な場合は一つ以上の失敗・境界ケース
- 画面上で観察できる状態変化と配送結果
- 学習者が変更できる操作と、操作後に期待する結果
- Network & Connectivity ではなく本カテゴリを主カテゴリとする理由

Firewall ルールの網羅や Network Boundary の詳細設計が中心になる候補は、この一覧から切り離して Security または Network & Connectivity で検討する。
