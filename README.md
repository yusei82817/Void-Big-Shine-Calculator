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
