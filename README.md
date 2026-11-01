# Void Big Shine Calculator

特殊関数・級数・積を扱うブラウザ向け数値計算機。

## 起動方法
GitHub Pages で公開する場合は、リポジトリの Settings → Pages から main ブランチの root を公開元に設定する。ビルド工程やサーバーは不要。Math.js を CDN から読み込むため、利用時はインターネット接続が必要。

## 対応関数
- `zeta(s)`: リーマンゼータ関数（Math.js）
- `gamma(z)`: ガンマ関数（Math.js）
- `beta(a,b)`: ベータ関数
- `sum("expression", a, b)`: n=a から b までの有限総和
- `prod("expression", a, b)`: n=a から b までの有限積
- `zetaEuler(s,N)`: 素数 p ≤ N のオイラー積。実数 s > 1
- `delta(a,b)`: クロネッカーのデルタ
- `heaviside(x)`: ヘヴィサイド関数（H(0)=1/2）
- `sinc(x)`: sin(x)/x（sinc(0)=1）

## 入力例
```
zeta(2)
gamma(5)
beta(2, 3)
sum("1/n^2", 1, 1000)
prod("1 - 1/n^2", 2, 1000)
zetaEuler(2, 1000)
delta(3, 3)
heaviside(0)
```

## 精度について
計算は JavaScript の倍精度浮動小数点数に基づく数値評価。総和・積・オイラー積は有限範囲で打ち切る近似値であり、厳密な無限和・無限積ではない。ディラックのデルタ関数は分布であり、通常の数値関数としては実装していない。