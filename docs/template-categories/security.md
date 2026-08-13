# Security

Security は、主体とリソースの間にある**信頼境界**と、アクセスを許可または拒否する**セキュリティ上の判断**を理解するためのテンプレートカテゴリである。

Firewall、WAF、Security Group、IAM、Identity Provider、Secrets、Encryption、Zero Trust などを題材に、Authentication（認証）、Authorization（認可）、Inspection（検査）、Allow / Deny、Block、Credential Rotation の流れをベンダーニュートラルに表現する。

このカテゴリのデモは概念の学習と比較を目的とする。セキュリティ診断、設定監査、脆弱性スキャンは行わず、実環境の安全性を保証または判定するものではない。実認証情報を入力・保存する機能も持たせない。

## 掲載基準

次の問いのいずれかがテンプレートの中心である場合、Security を主カテゴリとする。

- どの主体を信頼し、どの信頼境界を越えられるか
- 誰であるかをどのように認証し、何を行えるかをどのように認可するか
- 通信や要求をどこで検査し、どの条件で許可、拒否、またはブロックするか
- 秘密情報や暗号鍵をどこで保護し、どのようにローテーションするか
- 暗黙に信頼せず、要求ごとに検証する仕組みをどのように構成するか

セキュリティ要素が登場するだけでは Security に分類しない。テンプレートには主カテゴリを1つだけ設定し、主題ではない概念は補助タグとして扱う。

## Network & Connectivity との境界

分類は、登場するコンポーネントではなく、利用者が理解する中心的な問いで決める。

| 中心的な問い | 主カテゴリ | 例 |
| --- | --- | --- |
| どのネットワークやサブネットからどこへ接続できるか | Network & Connectivity | Public / Private Subnet、Peering、VPN、Private Link、Ingress / Egress の到達範囲 |
| 接続要求をどのルールやアイデンティティで許可・拒否するか | Security | Firewall、WAF、Security Group、IAM Policy、Zero Trust の判定 |

接続可能範囲、包含関係、経路そのものが主題なら Network & Connectivity とし、`security` などの補助タグを付ける。信頼境界を越える際の検査、認証、認可、Allow / Deny の判断が主題なら Security とし、`network` などの補助タグを付ける。

例えば Security Group を含む構成でも、サブネット間の到達性を比較するテンプレートは Network & Connectivity、同じ経路に対するルール評価と拒否理由を示すテンプレートは Security とする。

## 視覚表現

Allow / Deny を色だけで区別してはならない。状態は最低でもテキストラベルと形状または線種の組み合わせで伝える。

| 意味 | 必須の非色情報 | 補助的な色 |
| --- | --- | --- |
| Allow | `ALLOW` ラベル、チェック記号、通過を示す実線と矢印 | 緑系 |
| Deny / Block | `DENY` または `BLOCK` ラベル、×記号、遮断位置で終わる破線または終端バー | 赤系 |
| Authentication | `AUTHN` ラベル、主体から Identity Provider への検証ステップ | 青系 |
| Authorization | `AUTHZ` ラベル、Policy による判定ステップと判定理由 | 紫系 |
| Inspection | `INSPECT` ラベル、検査中を示す中間ステップ | 黄系 |
| Credential Rotation | 新旧の版番号または時刻、`ROTATE` ラベル、旧資格情報の失効状態 | 橙系 |

信頼境界はタイトル付きの囲み、境界線、または領域パターンで表し、色の違いだけに依存しない。アニメーションを停止した状態でも判定結果と遮断位置を読み取れるようにし、スクリーンリーダー向けの状態名も表示上の用語と一致させる。

Deny の表現では拒否された事実に加え、差し支えない範囲で「未認証」「権限不足」「ルール不一致」「検査でブロック」などの概念上の理由を示す。ただし、実環境の設定が安全かどうかを評価する文言は使わない。

## 非対象

- 実認証情報、秘密鍵、トークン、証明書の入力または保存
- セキュリティ診断、設定監査、脆弱性スキャン
- 実環境の安全性評価や準拠判定
- ベンダー固有サービスの網羅
- 個別テンプレートの Scenario や UI の実装

## 個別 Issue に分割する候補

各候補は1つの学習目標とシナリオに絞り、個別 Issue で背景、操作、状態遷移、受け入れ条件を定める。

- Firewall Allow / Deny — 送信元、宛先、ポートのルール評価と遮断位置
- WAF Request Inspection — 正常要求と検査でブロックされる要求
- Security Group Rule Evaluation — Ingress / Egress ルールと許可・拒否理由
- Authentication and Authorization — Identity Provider による認証と Policy による認可の違い
- IAM Least Privilege — 権限付与前後で変わる操作可能範囲
- Secrets and Credential Rotation — 新旧資格情報の切り替えと旧資格情報の失効
- Encryption in Transit and at Rest — 通信経路と保存先で異なる暗号化境界
- Zero Trust Access — 要求ごとのアイデンティティ、端末状態、Policy 検証

候補 Issue では実在する認証情報や環境を使わず、架空の主体、リソース、ルールだけを使用する。Provider 固有の表現が必要な場合も、主題はベンダーニュートラルに保ち、Provider は補助タグとして扱う。
