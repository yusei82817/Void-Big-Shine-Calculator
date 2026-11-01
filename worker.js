importScripts(
  "https://cdn.jsdelivr.net/npm/mathjs@14.8.1/lib/browser/math.js",
  "https://cdn.jsdelivr.net/npm/decimal.js@10.5.0/decimal.min.js"
);

function integer(v,label){const n=Number(v);if(!Number.isSafeInteger(n))throw Error(label+" は安全な整数で指定してね。");return n;}
function big(v,label="値"){const s=String(v);if(!/^-?\d+$/.test(s))throw Error(label+" は整数で指定してね。");return BigInt(s);}
function range(a,b,max){a=integer(a,"開始値");b=integer(b,"終了値");if(b<a||b-a+1>max)throw Error("範囲が項数上限を超えているよ。");return[a,b];}
function sum(e,a,b,max){[a,b]=range(a,b,max);let s=0,c=0;for(let n=a;n<=b;n++){const x=Number(math.evaluate(String(e),{n})),y=x-c,t=s+y;c=(t-s)-y;s=t;}return s;}
function prod(e,a,b,max){[a,b]=range(a,b,max);let v=1;for(let n=a;n<=b;n++)v=math.multiply(v,math.evaluate(String(e),{n}));return v;}
function primeNumber(n){if(n<2)return false;if(n%2===0)return n===2;for(let d=3;d*d<=n;d+=2)if(n%d===0)return false;return true;}
function euler(s,N,max){N=integer(N,"N");if(N<2||N>max||typeof s!=="number"||!Number.isFinite(s)||s<=1)throw Error("zetaEuler は s>1、2≤N≤項数上限で指定してね。");let v=1,c=0;for(let p=2;p<=N;p++)if(primeNumber(p)){v/=1-Math.pow(p,-s);c++;}return{value:v,count:c,max:N};}
function fact(n){n=integer(n,"n");if(n<0||n>100000)throw Error("fact は 0〜100,000。");let v=1n;for(let i=2n;i<=BigInt(n);i++)v*=i;return v.toString();}
function choose(n,k){n=integer(n,"n");k=integer(k,"k");if(n<0||n>100000||k<0||k>n)throw Error("choose は 0≤k≤n≤100,000。");k=Math.min(k,n-k);let v=1n;for(let i=1;i<=k;i++)v=v*BigInt(n-k+i)/BigInt(i);return v.toString();}
function fib(n){n=integer(n,"n");if(n<0||n>100000)throw Error("fib は 0〜100,000。");function f(k){if(!k)return[0n,1n];const[a,b]=f(Math.floor(k/2)),c=a*(2n*b-a),d=a*a+b*b;return k%2?[d,c+d]:[c,d];}return f(n)[0].toString();}
function bigPow(a,n){n=integer(n,"指数");if(n<0||n>100000)throw Error("指数は0〜100,000。");return(big(a,"底")**BigInt(n)).toString();}
function gcd(a,b){a=big(a);b=big(b);if(a<0n)a=-a;if(b<0n)b=-b;while(b)[a,b]=[b,a%b];return a.toString();}
function lcm(a,b){a=big(a);b=big(b);if(!a||!b)return"0";let x=a<0n?-a:a,y=b<0n?-b:b;while(y)[x,y]=[y,x%y];let v=a/x*b;return(v<0n?-v:v).toString();}
function modPow(a,e,m){a=big(a,"底");e=big(e,"指数");m=big(m,"法");if(e<0n||m<=0n)throw Error("指数は0以上、法は正の整数にしてね。");let r=1n%m;a=((a%m)+m)%m;while(e){if(e&1n)r=r*a%m;a=a*a%m;e>>=1n;}return r.toString();}
function isPrimeBig(value){let n=big(value,"n");if(n<2n)return false;if(n>1000000000000n)throw Error("isPrime は 10^12 以下に制限しているよ。");if(n%2n===0n)return n===2n;for(let d=3n;d*d<=n;d+=2n)if(n%d===0n)return false;return true;}
function factorize(value){let n=big(value,"n");if(n===0n)throw Error("0の素因数分解は定義できないよ。");if(n<0n)n=-n;if(n>1000000000000n)throw Error("factorize は絶対値 10^12 以下にしてね。");const out=[];let count=0;while(n%2n===0n){count++;n/=2n;}if(count)out.push({prime:"2",power:count});for(let d=3n;d*d<=n;d+=2n){count=0;while(n%d===0n){count++;n/=d;}if(count)out.push({prime:d.toString(),power:count});}if(n>1n)out.push({prime:n.toString(),power:1});return out.map(x=>x.prime+(x.power>1?"^"+x.power:"")).join(" × ")||"1";}
function primeCount(limit){const n=integer(limit,"N");if(n<0||n>5000000)throw Error("primeCount の N は 0〜5,000,000。");if(n<2)return 0;const sieve=new Uint8Array(n+1);sieve.fill(1,2);for(let p=2;p*p<=n;p++)if(sieve[p])for(let k=p*p;k<=n;k+=p)sieve[k]=0;let count=0;for(let i=2;i<=n;i++)count+=sieve[i];return count;}
function dec(op,a,b,p=80){p=integer(p,"精度");if(p<1||p>10000)throw Error("精度は1〜10,000桁。");const D=Decimal.clone({precision:p,rounding:Decimal.ROUND_HALF_EVEN}),x=new D(String(a)),y=b===undefined?null:new D(String(b));if(!x.isFinite()||(y&&!y.isFinite()))throw Error("有限の数値を指定してね。");if(op==="add")return x.plus(y).toString();if(op==="sub")return x.minus(y).toString();if(op==="mul")return x.times(y).toString();if(op==="div"){if(y.isZero())throw Error("0では割れないよ。");return x.div(y).toString();}if(op==="pow")return x.pow(y).toString();if(op==="sqrt"){if(x.isNegative())throw Error("負数の実数平方根は計算できないよ。");return x.sqrt().toString();}}
function evaluateExpression(expression,maxTerms){
 const scope={sum:(e,a,b)=>sum(e,a,b,maxTerms),prod:(e,a,b)=>prod(e,a,b,maxTerms),zetaEuler:(s,n)=>euler(s,n,maxTerms),delta:(a,b)=>Number(a)===Number(b)?1:0,heaviside:x=>Number(x)<0?0:Number(x)>0?1:.5,sinc:x=>Number(x)===0?1:math.sin(x)/x,beta:(a,b)=>math.gamma(a)*math.gamma(b)/math.gamma(a+b),fact,choose,fib,bigPow,gcd,lcm,modPow,isPrime:isPrimeBig,factorize,primeCount,dadd:(a,b,p)=>dec("add",a,b,p),dsub:(a,b,p)=>dec("sub",a,b,p),dmul:(a,b,p)=>dec("mul",a,b,p),ddiv:(a,b,p)=>dec("div",a,b,p),dpow:(a,b,p)=>dec("pow",a,b,p),dsqrt:(a,p)=>dec("sqrt",a,undefined,p)};
 return math.evaluate(expression,scope);
}
function formatValue(v){if(typeof v==="string")return v;if(v&&v.value!==undefined&&v.count!==undefined)return math.format(v.value,{precision:14});return math.format(v,{precision:14,lowerExp:-9,upperExp:14});}
self.onmessage=event=>{
 const {id,expression,maxTerms}=event.data;
 const started=performance.now();
 try{
  const value=evaluateExpression(expression,maxTerms);
  const elapsed=(performance.now()-started).toFixed(2);
  let kind="通常の数値評価";
  if(/\b(fact|choose|fib|bigPow|gcd|lcm|modPow|isPrime|factorize)\s*\(/i.test(expression))kind="BigIntによる整数演算";
  else if(/\b(primeCount)\s*\(/i.test(expression))kind="エラトステネスの篩による素数計数";
  else if(/\bd(add|sub|mul|div|pow|sqrt)\s*\(/i.test(expression))kind="Decimal.jsによる任意精度十進演算";
  else if(/\b(sum|prod|zetaEuler)\s*\(/i.test(expression))kind="有限範囲の数値近似";
  self.postMessage({id,ok:true,result:formatValue(value),detail:kind+"。計算時間 "+elapsed+" ms"});
 }catch(error){self.postMessage({id,ok:false,error:error&&error.message?error.message:"計算エラー"});}
};