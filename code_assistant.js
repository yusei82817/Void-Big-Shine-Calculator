(() => {
  "use strict";
  const prompt = document.getElementById("code-prompt");
  const button = document.getElementById("generate-code");
  const status = document.getElementById("generation-status");
  if (!prompt || !button || !status) return;
  prompt.addEventListener("input", () => {
    status.textContent = prompt.value.trim()
      ? "プロンプトを受け付けました。生成エンジン未接続のため、まだコードは生成されません。"
      : "生成エンジン未接続。AI APIまたはバックエンドの接続後にコード生成を有効化できます。";
  });
})();
