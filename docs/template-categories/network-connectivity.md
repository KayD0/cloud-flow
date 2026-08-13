# Network & Connectivity

## カテゴリの役割

Network & Connectivity は、クラウド上のリソースが**どの境界に含まれ、どこまで接続できるか**を理解するためのカテゴリである。Region、Availability Zone、VPC / VNet、Subnet などの包含関係と、Peering、VPN、Private Link、Internet / NAT Gateway などによって成立する接続性を、ベンダーニュートラルに表現する。

このカテゴリの説明文には、次の短縮版を使用できる。

> Region、ネットワーク境界、Subnet の包含関係と、Public / Private 間やネットワーク間の接続可否を可視化する。

## 掲載基準

次の問いへの回答がテンプレートの中心である場合、このカテゴリを主カテゴリとする。

- リソースはどの Region、Availability Zone、VPC / VNet、Subnet に属するか
- 2つのリソースまたはネットワークの間に接続経路が存在するか
- 接続は Public / Private のどちらを通るか
- Ingress / Egress のどちら向きの接続か
- Peering、VPN、Private Link、Internet Gateway、NAT Gateway の追加または切断で到達可能性がどう変わるか

代表概念は次のとおりとする。

| 観点 | 代表概念 |
| --- | --- |
| 地理・可用性の境界 | Region、Availability Zone |
| 論理ネットワーク境界 | VPC、VNet |
| ネットワークの分割 | Public Subnet、Private Subnet |
| ネットワーク間接続 | Peering、VPN |
| 非公開接続 | Private Link / Private Endpoint |
| 外部接続 | Internet Gateway、NAT Gateway |
| 接続状態 | Reachable、Unreachable、Connected、Disconnected |
| 接続方向 | Ingress、Egress、Bidirectional |

単にネットワーク要素が図に含まれるだけでは掲載理由にしない。包含関係または接続性の変化が、説明・操作・アニメーションの中心であることを必要条件とする。

## 他カテゴリとの境界

1テンプレートには主カテゴリを1つだけ設定し、他の関心事は補助タグで表す。分類に迷う場合は、テンプレートを見終えた利用者が答えられるようになる「主な問い」で決定する。

| 主な問い | 主カテゴリ | Network & Connectivity の扱い |
| --- | --- | --- |
| どの境界に属し、どこへ接続できるか | Network & Connectivity | 主カテゴリ |
| Request がどの経路を通り、どの規則で配送されるか | Traffic & Routing | `network-boundary`、`public-private` などの補助タグ |
| 通信を誰に許可または拒否するか | Security | `connectivity`、`trust-boundary` などの補助タグ |

### Traffic & Routing との境界

- VPC / VNet、Subnet、Peering、VPN などの**接続構造や到達可能範囲**が主題なら Network & Connectivity とする。
- Load Balancing、DNS、CDN、Proxy、Gateway による**Request の配送先、分岐規則、応答や遅延**が主題なら Traffic & Routing とする。
- Request の粒子表現は Network & Connectivity でも疎通確認の補助として使用できる。ただし、配送アルゴリズムや個々の Request の時系列を学習目標にはしない。

### Security との境界

- 経路や接続方式の有無によって決まる**到達可能 / 到達不能**が主題なら Network & Connectivity とする。
- Firewall、WAF、Security Group、IAM、Zero Trust などのポリシーによる**Allow / Deny、認証、認可、検査**が主題なら Security とする。
- Network & Connectivity では、Security Group や Route Table の個別ルールを再現しない。接続不可の理由がポリシーである場合は理由を注記し、詳細は Security の責務とする。

## 視覚表現

色だけに意味を持たせず、形、線種、ラベル、アイコンを組み合わせる。

| 意味 | 必須表現 | 補助表現 |
| --- | --- | --- |
| Region / Availability Zone | 名前付きの入れ子境界、異なる境界線 | 背景色の濃淡 |
| VPC / VNet | 実線の名前付きコンテナ | Providerタグまたはアイコン |
| Public Subnet | `PUBLIC` ラベル、外部接続アイコン | 明るい背景色 |
| Private Subnet | `PRIVATE` ラベル、閉じた境界 | 落ち着いた背景色 |
| Reachable / Connected | 連続した実線、矢印、`REACHABLE` ラベル | 接続色、疎通パルス |
| Unreachable / Disconnected | 途中で切れた線または×印、`UNREACHABLE` ラベル | 警告色 |
| Ingress | 境界の外から内へ向く矢印、`INGRESS` ラベル | 流入アニメーション |
| Egress | 境界の内から外へ向く矢印、`EGRESS` ラベル | 流出アニメーション |
| Bidirectional | 両端矢印または逆向きの2本の線 | 往復アニメーション |
| Internet経由 | Internetアイコンへ接続する線、`PUBLIC PATH` ラベル | 実線 |
| Private接続 | 閉じた境界内の線、`PRIVATE PATH` ラベル | 破線または専用色 |

Region は最外周の境界として表現する。Availability Zone と VPC / VNet の関係はクラウドによって異なるため、両者を固定順の入れ子にはしない。Subnet は VPC / VNet への所属と Availability Zone への配置を、それぞれ境界または明示ラベルで示す。Provider 固有テーマでは、そのクラウドの正しいスコープ関係を優先する。

アニメーションは接続性の変化を補助するものとし、停止状態でも線種、ラベル、状態アイコンから同じ情報を読み取れるようにする。`prefers-reduced-motion` では移動やパルスを停止する。

## 想定する動きと操作

- 接続の確立と切断
- Gateway、Peering、VPN、Private Link の追加と削除
- Public / Private 経路の切り替え
- Ingress / Egress の方向切り替え
- 疎通確認による Reachable / Unreachable の表示
- 境界の展開・折りたたみ、接続経路の強調

操作結果は実環境へ反映しない。CIDR の入力・計算、自由配置のネットワーク設計、Route Table や Security Group の同期は提供しない。

## 個別テンプレート候補

以下はそれぞれ独立した Issue に分割する。各 Issue では1つの学習目標、初期状態、操作、状態遷移、完了条件を定義する。

| Issue候補 | 主な学習目標 | 最小操作 | 補助タグ候補 |
| --- | --- | --- | --- |
| Public / Private Subnet の境界 | Subnet の公開範囲と所属関係を区別する | 境界の強調、外部疎通の切り替え | `subnet`、`public-private` |
| Internet Gateway と NAT Gateway | Ingress可能な公開経路と、Private SubnetからのEgress専用経路を比較する | Gateway の有効化・無効化 | `gateway`、`ingress`、`egress` |
| VPC / VNet Peering | 2つの論理ネットワーク間で接続が成立する変化を理解する | Peering の接続・切断 | `peering`、`private-connectivity` |
| Site-to-Site VPN | オンプレミスとクラウドの私設接続を理解する | VPN の確立・切断 | `hybrid-cloud`、`vpn` |
| Private Link / Private Endpoint | Public Internetを経由せずサービスへ接続する経路を理解する | Public / Private 経路の比較 | `private-link`、`private-connectivity` |
| Multi-Region Connectivity | Regionをまたぐ境界と接続状態を理解する | Region間接続の切り替え | `multi-region`、`connectivity` |

## 非対象

- CIDR 計算、アドレス割り当て、IP 重複検出
- 汎用ネットワーク設計エディタ
- 実環境の Route Table、Security Group、Network ACL の取得または同期
- パケットキャプチャやプロトコル単位の解析
- ベンダー固有ネットワーク製品の網羅
- 上記候補を含む個別テンプレートの Scenario 実装
