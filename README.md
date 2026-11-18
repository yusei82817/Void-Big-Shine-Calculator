# Void Big Shine Calculator

ブラウザで動作する数学計算エンジン。特殊関数・級数・積、巨大整数、任意精度十進演算、整数論ツールを搭載。

## 起動方法
GitHub Pages の Settings → Pages から main ブランチの root を公開元に設定。Math.js と Decimal.js をCDNから読み込むためインターネット接続が必要。計算は `worker.js` のWeb Workerで実行し、計算中も画面を操作できる。中止ボタンで実行中のWorkerを終了できる。

## 特殊関数
- `zeta(s)`, `gamma(z)`, `beta(a,b)`
- `delta(a,b)`: クロネッカーのデルタ
- `heaviside(x)`: H(0)=1/2
- `sinc(x)`: sin(x)/x、sinc(0)=1

## 総和・積
- `sum("expression",a,b)`: 補償和を使った有限総和
- `prod("expression",a,b)`: 有限積
- `zetaEuler(s,N)`: 素数 p≤N のオイラー積（実数 s>1）
- 総和・積・オイラー積の項数は画面の「項数上限」に従う（10〜50,000）。

## 巨大整数（BigInt）
- `fact(n)`: 階乗、0≤n≤100,000
- `choose(n,k)`: 二項係数、0≤k≤n≤100,000
- `fib(n)`: 高速倍加法、0≤n≤100,000
- `bigPow(a,n)`: 巨大整数の非負整数べき乗
- `gcd(a,b)`, `lcm(a,b)`: 最大公約数・最小公倍数
- `modPow(a,e,m)`: 巨大整数の剰余べき乗

巨大整数の引数は文字列で渡すと安全。例: `gcd("12345678901234567890","9876543210")`。

## 整数論
- `isPrime(n)`: 10¹²以下の整数の素数判定（試し割り）
- `factorize(n)`: 10¹²以下の整数の素因数分解
- `primeCount(n)`: n以下の素数の個数。エラトステネスの篩、n≤5,000,000

## 任意精度十進演算（Decimal.js）
- `dadd(a,b,p)`, `dsub(a,b,p)`, `dmul(a,b,p)`, `ddiv(a,b,p)`
- `dpow(a,b,p)`, `dsqrt(a,p)`
- p は有効桁数で1〜10,000。例: `ddiv("1","7",100)`。

## 精度と性能
BigIntの整数演算は正確。Decimal.jsは指定有効桁数で丸める十進演算。通常のMath.js関数と級数・積はJavaScript倍精度で評価され、級数・積は有限範囲の近似値。整数論の素数判定・素因数分解は試し割りで最大10¹²、素数計数は篩で最大500万に制限。巨大計算は端末のメモリ・処理能力に依存する。


## 行列・複素数演算
- `det(A)`: 行列式
- `inv(A)`: 逆行列
- `transpose(A)`: 転置行列
- `matmul(A,B)`: 行列積
- `cplx(re,im)`: 複素数を生成
- 例: `det([[1,2],[3,4]])`, `cplx(3,2)^2`

## 数値解析
- `integral("f(x)",a,b,n)`: 合成Simpson公式による定積分近似。分割数2〜1,000,000（奇数は次の偶数へ切り上げ）。
- `diff("f(x)",x,h)`: 中心差分による微分係数近似。hは正。
- `rootBisect("f(x)",a,b,tol,maxIter)`: 二分法。区間端点の関数値の符号が異なる必要がある。
- `newton("f(x)",x0,tol,maxIter)`: 数値微分を使うNewton法。初期値によっては収束しない。
- これらは倍精度浮動小数点数による数値近似であり、厳密解・誤差保証を意味しない。


## PWA（Progressive Web App）
- `manifest.webmanifest` にアプリ名・起動URL・表示モード・アイコンを定義。
- `service-worker.js` がアプリシェルをキャッシュし、再訪問時とオフライン時に画面を表示。
- Chromeが `beforeinstallprompt` を発火した場合、ヘッダーに「アプリをインストール」ボタンを表示。
- Math.js / Decimal.js とWebフォントは初回オンライン時にキャッシュを試みる。翻訳機能は外部APIを使うため、オフラインでは利用できない。
- Chromeのアドレスバーに表示されるインストールアイコン自体はブラウザが制御する。表示されない場合はChromeメニューの「キャスト、保存、共有」→「ページをアプリとしてインストール」も確認。

## SONORA Music Studio
- Sidebar の「SONORA Music Studio」から音楽制作画面へ移動。
- アプリ本体は `apps/sonora/` に分離し、専用CSS・JavaScript・Manifest・Service Workerを配置。
- Web Audio APIによる独自ボイス管理型シンセサイザー、16ステップシーケンサー、仮想鍵盤を搭載。
- プロジェクトはIndexedDBに保存し、JSON形式で書き出し可能。
- SONORAは親サイトとは別のPWA ManifestとService Workerスコープを持つ。

## 扇形の弧の長さ
画面の「扇形の弧の長さ」で半径 `r` と中央角 `θ`（度）を入力する。
`L = 2πr × θ / 360` で計算。中央角は0°〜360°。
