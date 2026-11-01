(() => {
  "use strict";

  const input = document.getElementById("expression");
  const termsInput = document.getElementById("terms");
  const result = document.getElementById("result");
  const detail = document.getElementById("detail");
  const status = document.getElementById("status");
  const calculateButton = document.getElementById("calculate");

  function integer(value, label) {
    const number = Number(value);
    if (!Number.isFinite(number) || !Number.isInteger(number)) {
      throw new Error(label + " は整数で指定してね。");
    }
    return number;
  }

  function checkRange(start, end) {
    const a = integer(start, "開始値");
    const b = integer(end, "終了値");
    if (b < a) throw new Error("終了値は開始値以上にしてね。");
    if (b - a > 50000) throw new Error("範囲が大きすぎるよ。最大 50,001 項まで。");
    return [a, b];
  }

  function partialSum(expression, start, end) {
    const [a, b] = checkRange(start, end);
    let total = 0;
    for (let n = a; n <= b; n++) {
      total = math.add(total, math.evaluate(String(expression), { n }));
    }
    return total;
  }

  function partialProduct(expression, start, end) {
    const [a, b] = checkRange(start, end);
    let total = 1;
    for (let n = a; n <= b; n++) {
      total = math.multiply(total, math.evaluate(String(expression), { n }));
    }
    return total;
  }

  function isPrime(n) {
    if (n < 2) return false;
    if (n % 2 === 0) return n === 2;
    for (let d = 3; d * d <= n; d += 2) {
      if (n % d === 0) return false;
    }
    return true;
  }

  function eulerProduct(s, limit) {
    const max = integer(limit, "上限 N");
    if (max < 2 || max > 50000) throw new Error("オイラー積の上限 N は 2〜50,000 にしてね。");
    if (math.isComplex(s) || Number(s) <= 1) {
      throw new Error("この実数版オイラー積は s > 1 の実数で使ってね。");
    }
    let value = 1;
    let count = 0;
    for (let p = 2; p <= max; p++) {
      if (!isPrime(p)) continue;
      const factor = math.divide(1, math.subtract(1, math.pow(p, math.unaryMinus(s))));
      value = math.multiply(value, factor);
      count++;
    }
    return { value, count, max };
  }

  const scope = {
    sum: partialSum,
    prod: partialProduct,
    zetaEuler: eulerProduct,
    delta: (a, b) => Number(a) === Number(b) ? 1 : 0,
    heaviside: x => Number(x) < 0 ? 0 : Number(x) > 0 ? 1 : 0.5,
    sinc: x => Number(x) === 0 ? 1 : math.divide(math.sin(x), x),
    beta: (a, b) => math.divide(math.multiply(math.gamma(a), math.gamma(b)), math.gamma(math.add(a, b))),
    phi: x => (1 + Math.sqrt(5)) / 2
  };

  function formatValue(value) {
    if (value && value.value !== undefined && value.count !== undefined) {
      return math.format(value.value, { precision: 14 });
    }
    if (typeof value === "number" && !Number.isFinite(value)) {
      return String(value);
    }
    return math.format(value, { precision: 14, lowerExp: -9, upperExp: 14 });
  }

  function calculate() {
    const expression = input.value.trim();
    if (!expression) {
      result.textContent = "数式を入力してね";
      detail.textContent = "例: zeta(2) / gamma(5) / sum(\"1/n^2\", 1, 1000)";
      status.textContent = "WAITING";
      return;
    }

    const requestedTerms = Math.min(50000, Math.max(10, integer(termsInput.value || 1000, "項数")));
    termsInput.value = String(requestedTerms);
    const started = performance.now();

    try {
      const value = math.evaluate(expression, scope);
      const elapsed = (performance.now() - started).toFixed(2);
      result.textContent = formatValue(value);
      status.textContent = "SUCCESS";
      if (/\bsum\s*\(/i.test(expression)) {
        detail.textContent = "有限範囲の総和を計算。計算時間 " + elapsed + " ms";
      } else if (/\bprod\s*\(/i.test(expression)) {
        detail.textContent = "有限範囲の積（無限積の部分積近似）を計算。計算時間 " + elapsed + " ms";
      } else if (/\bzetaEuler\s*\(/i.test(expression)) {
        detail.textContent = "素数 " + value.count + " 個、p ≤ " + value.max + " のオイラー積による近似。計算時間 " + elapsed + " ms";
      } else {
        detail.textContent = "数値評価完了。計算時間 " + elapsed + " ms";
      }
    } catch (error) {
      result.textContent = "計算できませんでした";
      detail.textContent = error && error.message ? error.message : "数式を確認してね。";
      status.textContent = "ERROR";
    }
  }

  calculateButton.addEventListener("click", calculate);
  input.addEventListener("keydown", event => {
    if (event.key === "Enter") calculate();
  });
  document.querySelectorAll("[data-expression]").forEach(button => {
    button.addEventListener("click", () => {
      input.value = button.dataset.expression;
      input.focus();
      calculate();
    });
  });

  if (typeof math === "undefined") {
    result.textContent = "数値エンジンを読み込めません";
    detail.textContent = "ネット接続を確認してページを再読み込みしてね。";
    status.textContent = "OFFLINE";
    calculateButton.disabled = true;
  }
})();