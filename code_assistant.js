(() => {
  "use strict";
  const SUPABASE_URL = "https://cirmydnldoimshyvjkao.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_enn8EFBDHBgAdJliRZ7Q9g__j-oNvuw";
  const SUPABASE_ANON_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpcm15ZG5sZG9pbXNoeXZqa2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMjY0MDIsImV4cCI6MjEwODcwMjQwMn0.kbkC5H02VQAoRFjnc3G7Js-Zb0JWKsVFfLEjbqo4Q_w";

  const prompt = document.getElementById("code-prompt");
  const language = document.getElementById("code-language");
  const button = document.getElementById("generate-code");
  const status = document.getElementById("generation-status");
  const output = document.querySelector("#output-code code");
  const copyButton = document.getElementById("copy-code");
  const modelLabel = document.getElementById("output-model");
  if (!prompt || !language || !button || !status || !output || !copyButton) return;

  let latestCode = "";
  const setBusy = (busy) => {
    button.disabled = busy;
    button.classList.toggle("is-loading", busy);
    button.textContent = busy ? "GENERATING..." : "GENERATE CODE ↗";
  };

  prompt.addEventListener("input", () => {
    button.disabled = !prompt.value.trim();
    status.textContent = prompt.value.trim()
      ? "プロンプトを受け付けました。生成ボタンからコードを作成できます。"
      : "生成したい内容を入力してください。";
  });

  button.addEventListener("click", async () => {
    const requestText = prompt.value.trim();
    if (!requestText || button.disabled) return;
    if (requestText.length > 8000) {
      status.textContent = "入力は8,000文字以内にしてください。";
      return;
    }

    setBusy(true);
    status.textContent = "Geminiにコード生成を依頼しています...";
    output.textContent = "GENERATING...";
    copyButton.disabled = true;
    latestCode = "";

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/code-generator`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_PUBLISHABLE_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_JWT}`
        },
        body: JSON.stringify({ prompt: requestText, format: language.value })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `生成に失敗しました（HTTP ${response.status}）`);
      latestCode = typeof data.code === "string" ? data.code : "";
      if (!latestCode) throw new Error("AIからコードを取得できませんでした。");
      output.textContent = latestCode;
      modelLabel.textContent = data.model || "GEMINI";
      copyButton.disabled = false;
      status.textContent = "コードを生成しました。内容を確認してコピーできます。";
    } catch (error) {
      output.textContent = "OUTPUT ERROR";
      status.textContent = error instanceof Error ? error.message : "予期しないエラーが発生しました。";
    } finally {
      setBusy(false);
      button.disabled = !prompt.value.trim();
    }
  });

  copyButton.addEventListener("click", async () => {
    if (!latestCode) return;
    try {
      await navigator.clipboard.writeText(latestCode);
      status.textContent = "コードをクリップボードにコピーしました。";
    } catch {
      status.textContent = "コピーできませんでした。ブラウザの権限を確認してください。";
    }
  });
})();
