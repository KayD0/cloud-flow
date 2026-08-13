# Cloud Flow

Cloud Flow は、インフラ・クラウドの構成だけでなく、通信、処理、障害、復旧、スケーリングなどの「動き」を Web 上で視覚的に表現する React / TypeScript UI ライブラリとショーケースです。

## 責務境界

### ライブラリ本体

- Node、Connection、State、Region / Network Boundary、Scenario、Controls のベンダーニュートラルな型を提供する
- 時間経過、状態遷移、振り分け規則を、描画技術や React コンポーネントから独立した純粋なロジックとして扱う
- Canvas、Node、Connection、Scenario、Controls を疎結合にし、外部から状態と再生を制御できる公開 API を目指す
- AWS / Azure / GCP 固有要素は、将来 Provider / Theme としてコアの外側に追加する

### ショーケースサイト

- ライブラリのコンポーネント、表現パターン、操作性を実ブラウザで検証する
- 説明文と動くデモを組み合わせ、パターンを学習・比較できる場を提供する
- デモ固有のレイアウト、コピー、テーマを持つが、シナリオの業務ルールは持たない

現在は同一 Next.js アプリ内で `src/lib/infrastructure` をライブラリ境界、`src/components` と `src/app` をショーケース境界としている。npm パッケージ化時に前者を workspace package として抽出する。

## 基本設計

依存方向は `model / scenario → React controller → SVG / CSS presentation` とする。SVG は Connection とリクエスト経路に用いるが、基本モデルと状態遷移は SVG、React Flow、特定アニメーションライブラリに依存しない。

最初の縦切りは Round Robin Load Balancing。Client、Load Balancer、Server A / B / C、Healthy / Processing / Down、Start / Pause / Reset、速度、Traffic、Failure / Recovery を含む。Down のサーバーは次の振り分け候補から除外する。

アニメーションは MVP では React のタイマーで進むシナリオ状態を SVG に投影し、CSS transition で補間する。制御性を確認する最小構成であり、公開 API は固定しない。`prefers-reduced-motion` では補間とスクロールアニメーションを停止する。

## テンプレートカテゴリ

- [Reliability & Recovery](docs/template-categories/reliability-recovery.md) — 障害の検知、切り離し、復旧判断と復旧完了までの時間変化

## 開発

```bash
npm ci
npm test
npm run lint
npm run build
```

## テンプレートカテゴリ

- [Network & Connectivity](docs/template-categories/network-connectivity.md)

## MVP の先

Request Flow、Auto Scaling、Public / Private Subnet、Multi-AZ Failover を順次追加する。Cache HIT / MISS、Queue、Replication、Retry、Circuit Breaker、クラウド Provider / Theme、npm 公開、学習サイト連携は将来拡張とする。
