(() => {
  "use strict";

  const SUPABASE_URL = "https://cirmydnldoimshyvjkao.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_enn8EFBDHBgAdJliRZ7Q9g__j-oNvuw";
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  const $ = (id) => document.getElementById(id);
  const views = ["auth-view","dashboard-view","editor-view","results-view","public-view","thanks-view"];
  let currentUser = null;
  let currentSurvey = null;
  let currentQuestions = [];
  let currentResponses = [];
  let currentAnswers = [];
  let currentChoices = [];
  let publicSurvey = null;
  let publicQuestions = [];

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[char]));
  const uuid = () => crypto.randomUUID();
  const showMessage = (message, type = "") => {
    const box = $("global-message");
    box.textContent = message;
    box.className = "global-message" + (type ? " " + type : "");
    box.hidden = !message;
    if (message) box.scrollIntoView({behavior:"smooth",block:"nearest"});
  };
  const showView = (viewId) => {
    views.forEach((id) => $(id).hidden = id !== viewId);
    $("signout-button").hidden = !currentUser || viewId === "public-view" || viewId === "thanks-view";
    if (viewId !== "public-view" && viewId !== "thanks-view") showMessage("");
  };
  const setBusy = (button, busy, busyText = "処理中...") => {
    if (!button) return;
    if (busy) {
      button.dataset.originalText = button.textContent;
      button.textContent = busyText;
      button.disabled = true;
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.disabled = false;
    }
  };
  const statusLabel = (status) => status === "published" ? "公開中" : status === "closed" ? "受付終了" : "下書き";

  async function loadDashboard() {
    showView("dashboard-view");
    $("survey-list").innerHTML = '<div class="empty-state">読み込み中...</div>';
    const {data, error} = await client.from("surveys").select("id,title,description,status,public_token,created_at").order("created_at",{ascending:false});
    if (error) {
      $("survey-list").innerHTML = '<div class="empty-state">一覧を読み込めませんでした。</div>';
      showMessage(error.message,"error");
      return;
    }
    if (!data.length) {
      $("survey-list").innerHTML = '<div class="empty-state">まだアンケートがありません。右上の「新しいアンケート」から作成できます。</div>';
      return;
    }
    $("survey-list").innerHTML = data.map((survey) => `
      <article class="survey-item">
        <div><h3>${escapeHtml(survey.title)}</h3><div class="survey-meta">${statusLabel(survey.status)} · ${new Date(survey.created_at).toLocaleString("ja-JP")}</div></div>
        <div class="survey-item-actions">
          <button class="secondary-button" data-open="${survey.id}" type="button">編集・集計</button>
        </div>
      </article>`).join("");
    $("survey-list").querySelectorAll("[data-open]").forEach((button) => {
      button.addEventListener("click", () => openEditor(button.dataset.open));
    });
  }

  async function openEditor(id) {
    const {data:survey,error} = await client.from("surveys").select("*").eq("id",id).single();
    if (error) return showMessage(error.message,"error");
    currentSurvey = survey;
    $("survey-title").value = survey.title;
    $("survey-description").value = survey.description || "";
    $("survey-status").textContent = statusLabel(survey.status).toUpperCase();
    $("survey-status-help").textContent = survey.status === "published" ? "公開中です。回答用URLから回答できます。" : survey.status === "closed" ? "受付を終了しています。再公開すると回答を受け付けます。" : "下書き状態です。公開すると回答用URLが有効になります。";
    $("publish-button").textContent = survey.status === "published" ? "公開中" : "公開する";
    $("publish-button").disabled = survey.status === "published";
    $("close-survey-button").disabled = survey.status !== "published";
    $("share-box").hidden = survey.status !== "published";
    const shareUrl = new URL(location.href);
    shareUrl.search = "";
    shareUrl.searchParams.set("s",survey.public_token);
    $("share-url").textContent = shareUrl.href;
    const {data:questions,error:qError} = await client.from("questions").select("id,survey_id,question_text,question_type,is_required,position").eq("survey_id",id).order("position");
    if (qError) return showMessage(qError.message,"error");
    const {data:options,error:oError} = await client.from("question_options").select("id,question_id,option_text,position").eq("survey_id",id).order("position");
    if (oError) return showMessage(oError.message,"error");
    currentQuestions = questions.map((q) => ({...q,options:options.filter((o) => o.question_id === q.id)}));
    renderQuestionList();
    const {count} = await client.from("responses").select("id",{count:"exact",head:true}).eq("survey_id",id);
    $("editor-response-count").textContent = count ?? 0;
    showView("editor-view");
  }

  function renderQuestionList() {
    $("question-count").textContent = currentQuestions.length + " QUESTIONS";
    if (!currentQuestions.length) {
      $("question-list").innerHTML = '<div class="empty-state">質問はまだありません。上のフォームから追加してください。</div>';
      return;
    }
    const typeNames = {single:"単一選択",multiple:"複数選択",text:"自由記述"};
    $("question-list").innerHTML = currentQuestions.map((q,index) => `
      <article class="question-item">
        <div class="question-item-head">
          <div><h3>${index+1}. ${escapeHtml(q.question_text)} ${q.is_required ? '<span class="required-mark">必須</span>' : ''}</h3>
          <p>${typeNames[q.question_type]} · ${q.options.length} 選択肢</p></div>
          <button class="danger-button" data-delete-question="${q.id}" type="button">削除</button>
        </div>
        ${q.options.length ? '<div class="option-preview">'+q.options.map(o=>'<span class="option-chip">'+escapeHtml(o.option_text)+'</span>').join("")+'</div>' : ''}
      </article>`).join("");
    $("question-list").querySelectorAll("[data-delete-question]").forEach((button) => {
      button.addEventListener("click", () => deleteQuestion(button.dataset.deleteQuestion));
    });
  }

  async function createSurvey() {
    const title = "新しいアンケート";
    const {data,error} = await client.from("surveys").insert({owner_id:currentUser.id,title}).select("id").single();
    if (error) return showMessage(error.message,"error");
    await openEditor(data.id);
  }

  async function deleteQuestion(id) {
    if (!confirm("この質問を削除しますか？")) return;
    const {error} = await client.from("questions").delete().eq("id",id).eq("survey_id",currentSurvey.id);
    if (error) return showMessage(error.message,"error");
    currentQuestions = currentQuestions.filter((q) => q.id !== id);
    renderQuestionList();
    showMessage("質問を削除しました。","success");
  }

  async function loadResults() {
    showView("results-view");
    $("results-title").textContent = currentSurvey.title;
    $("results-content").innerHTML = '<div class="empty-state">集計中...</div>';
    const [responsesResult,answersResult,choicesResult] = await Promise.all([
      client.from("responses").select("id,submitted_at").eq("survey_id",currentSurvey.id).order("submitted_at",{ascending:false}),
      client.from("answers").select("id,response_id,question_id,text_value").eq("survey_id",currentSurvey.id),
      client.from("answer_choices").select("answer_id,question_id,option_id").eq("survey_id",currentSurvey.id)
    ]);
    const error = responsesResult.error || answersResult.error || choicesResult.error;
    if (error) {
      $("results-content").innerHTML = '<div class="empty-state">集計を読み込めませんでした。</div>';
      return showMessage(error.message,"error");
    }
    currentResponses = responsesResult.data || [];
    currentAnswers = answersResult.data || [];
    currentChoices = choicesResult.data || [];
    $("total-responses").textContent = currentResponses.length;
    $("total-questions").textContent = currentQuestions.length;
    renderResults();
  }

  function renderResults() {
    if (!currentQuestions.length) {
      $("results-content").innerHTML = '<div class="empty-state">質問がありません。</div>';
      return;
    }
    $("results-content").innerHTML = currentQuestions.map((q,index) => {
      const answers = currentAnswers.filter((a) => a.question_id === q.id);
      if (q.question_type === "text") {
        const texts = answers.filter((a) => a.text_value?.trim()).map((a) => '<div class="text-answer">'+escapeHtml(a.text_value)+'</div>').join("");
        return '<article class="result-question"><h3>'+(index+1)+'. '+escapeHtml(q.question_text)+'</h3><div class="result-subtitle">FREE TEXT · '+answers.length+' ANSWERS</div>'+(texts || '<p class="no-answers">自由記述の回答はありません。</p>')+'</article>';
      }
      const counts = q.options.map((option) => ({
        label:option.option_text,
        count:currentChoices.filter((c) => c.question_id === q.id && c.option_id === option.id).length
      }));
      const total = counts.reduce((sum,item)=>sum+item.count,0);
      return '<article class="result-question"><h3>'+(index+1)+'. '+escapeHtml(q.question_text)+'</h3><div class="result-subtitle">'+(q.question_type === "single" ? "SINGLE CHOICE" : "MULTIPLE CHOICE")+' · '+total+' SELECTIONS</div>'+
        (counts.length ? counts.map((item) => '<div class="result-option"><span>'+escapeHtml(item.label)+'</span><div class="bar-track"><div class="bar-fill" style="width:'+(total ? item.count/total*100 : 0)+'%"></div></div><span class="result-count">'+item.count+' ('+(total ? (item.count/total*100).toFixed(1) : "0.0")+'%)</span></div>').join("") : '<p class="no-answers">選択肢がありません。</p>')+
        '</article>';
    }).join("");
  }

  function downloadCsv() {
    const rows = [["response_id","submitted_at","question","answer"]];
    currentAnswers.forEach((answer) => {
      const question = currentQuestions.find((q) => q.id === answer.question_id);
      const response = currentResponses.find((r) => r.id === answer.response_id);
      if (!question || !response) return;
      if (question.question_type === "text") {
        rows.push([response.id,response.submitted_at,question.question_text,answer.text_value || ""]);
      } else {
        const selected = currentChoices.filter((c) => c.answer_id === answer.id);
        const labels = selected.map((c) => question.options.find((o) => o.id === c.option_id)?.option_text || "").filter(Boolean);
        rows.push([response.id,response.submitted_at,question.question_text,labels.join(" / ")]);
      }
    });
    const csv = "\uFEFF" + rows.map((row) => row.map((cell) => '"'+String(cell ?? "").replace(/"/g,'""')+'"').join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const a = document.createElement("a");
    a.href = url;
    a.download = (currentSurvey.title || "survey").replace(/[\\/:*?"<>|]/g,"_") + "_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function loadPublicSurvey(token) {
    showView("public-view");
    $("public-content").innerHTML = '<div class="empty-state">アンケートを読み込んでいます...</div>';
    const {data:survey,error} = await client.from("public_surveys").select("id,title,description,public_token").eq("public_token",token).maybeSingle();
    if (error || !survey) {
      $("public-content").innerHTML = '<div class="empty-state">アンケートが見つからないか、現在公開されていません。</div>';
      return;
    }
    publicSurvey = survey;
    const {data:questions,error:qError} = await client.from("questions").select("id,question_text,question_type,is_required,position").eq("survey_id",survey.id).order("position");
    if (qError) {
      $("public-content").innerHTML = '<div class="empty-state">質問を読み込めませんでした。</div>';
      return;
    }
    const {data:options,error:oError} = await client.from("question_options").select("id,question_id,option_text,position").eq("survey_id",survey.id).order("position");
    if (oError) {
      $("public-content").innerHTML = '<div class="empty-state">選択肢を読み込めませんでした。</div>';
      return;
    }
    publicQuestions = questions.map((q) => ({...q,options:options.filter((o)=>o.question_id===q.id)}));
    renderPublicSurvey();
  }

  function renderPublicSurvey() {
    $("public-content").innerHTML = `
      <p class="eyebrow">PLEASE SHARE YOUR THOUGHTS</p>
      <h1 class="public-title">${escapeHtml(publicSurvey.title)}</h1>
      <p class="public-description">${escapeHtml(publicSurvey.description || "")}</p>
      <form id="public-response-form">
        ${publicQuestions.map((q,index) => `
          <section class="public-question">
            <h3>${index+1}. ${escapeHtml(q.question_text)} ${q.is_required ? '<span class="required-mark">必須</span>' : ''}</h3>
            ${q.question_type === "text"
              ? '<textarea name="q_'+q.id+'" '+(q.is_required?'required':'')+' maxlength="5000" placeholder="回答を入力してください"></textarea>'
              : '<div class="public-options">'+q.options.map((o)=>'<label class="public-option"><input type="'+(q.question_type==="single"?"radio":"checkbox")+'" name="q_'+q.id+'" value="'+o.id+'"> '+escapeHtml(o.option_text)+'</label>').join("")+'</div>'}
          </section>`).join("")}
        <button class="primary-button public-submit" type="submit">回答を送信する ↗</button>
      </form>`;
    $("public-response-form").addEventListener("submit",submitPublicResponse);
  }

  async function submitPublicResponse(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("button[type=submit]");
    setBusy(button,true,"送信中...");
    const formData = new FormData(form);
    for (const question of publicQuestions) {
      const values = formData.getAll("q_"+question.id).map((value)=>String(value).trim()).filter(Boolean);
      if (question.is_required && values.length === 0) {
        setBusy(button,false);
        return showMessage("必須項目に回答してください: "+question.question_text,"error");
      }
    }
    const responseId = uuid();
    const {error:responseError} = await client.from("responses").insert({id:responseId,survey_id:publicSurvey.id});
    if (responseError) {
      setBusy(button,false);
      return showMessage("回答を送信できませんでした: "+responseError.message,"error");
    }
    const answers = [];
    const selectedChoices = [];
    for (const question of publicQuestions) {
      if (question.question_type === "text") {
        const value = String(formData.get("q_"+question.id) || "").trim();
        if (value) answers.push({id:uuid(),response_id:responseId,survey_id:publicSurvey.id,question_id:question.id,text_value:value});
      } else {
        const values = formData.getAll("q_"+question.id).map(String);
        if (values.length) {
          const answerId = uuid();
          answers.push({id:answerId,response_id:responseId,survey_id:publicSurvey.id,question_id:question.id,text_value:null});
          values.forEach((optionId)=>selectedChoices.push({survey_id:publicSurvey.id,question_id:question.id,answer_id:answerId,option_id:optionId}));
        }
      }
    }
    if (answers.length) {
      const {error:answerError} = await client.from("answers").insert(answers);
      if (answerError) {
        setBusy(button,false);
        return showMessage("回答内容を保存できませんでした: "+answerError.message,"error");
      }
    }
    if (selectedChoices.length) {
      const {error:choiceError} = await client.from("answer_choices").insert(selectedChoices);
      if (choiceError) {
        setBusy(button,false);
        return showMessage("選択内容を保存できませんでした: "+choiceError.message,"error");
      }
    }
    showView("thanks-view");
  }

  $("auth-form").addEventListener("submit",async(event)=>{
    event.preventDefault();
    const button = $("login-button");
    setBusy(button,true,"ログイン中...");
    const {data,error} = await client.auth.signInWithPassword({email:$("auth-email").value.trim(),password:$("auth-password").value});
    setBusy(button,false);
    if (error) return showMessage(error.message,"error");
    currentUser = data.user;
    await loadDashboard();
  });
  $("signup-button").addEventListener("click",async()=>{
    const email = $("auth-email").value.trim();
    const password = $("auth-password").value;
    if (!email || password.length < 6) return showMessage("メールアドレスと6文字以上のパスワードを入力してください。","error");
    setBusy($("signup-button"),true,"登録中...");
    const {data,error} = await client.auth.signUp({email,password});
    setBusy($("signup-button"),false);
    if (error) return showMessage(error.message,"error");
    if (!data.session) showMessage("登録メールを送信しました。メール確認を完了してからログインしてください。","success");
    else { currentUser = data.user; await loadDashboard(); }
  });
  $("signout-button").addEventListener("click",async()=>{
    await client.auth.signOut();
    currentUser = null;
    showView("auth-view");
  });
  $("new-survey-button").addEventListener("click",createSurvey);
  $("back-dashboard").addEventListener("click",loadDashboard);
  $("back-editor").addEventListener("click",()=>openEditor(currentSurvey.id));
  $("survey-settings-form").addEventListener("submit",async(event)=>{
    event.preventDefault();
    const {error} = await client.from("surveys").update({title:$("survey-title").value.trim(),description:$("survey-description").value.trim(),updated_at:new Date().toISOString()}).eq("id",currentSurvey.id);
    if (error) return showMessage(error.message,"error");
    currentSurvey.title = $("survey-title").value.trim();
    currentSurvey.description = $("survey-description").value.trim();
    showMessage("アンケート設定を保存しました。","success");
  });
  $("publish-button").addEventListener("click",async()=>{
    if (!currentQuestions.length) return showMessage("公開する前に、質問を1つ以上追加してください。","error");
    const {error} = await client.from("surveys").update({status:"published",updated_at:new Date().toISOString()}).eq("id",currentSurvey.id);
    if (error) return showMessage(error.message,"error");
    await openEditor(currentSurvey.id);
    showMessage("アンケートを公開しました。URLを共有できます。","success");
  });
  $("close-survey-button").addEventListener("click",async()=>{
    const {error} = await client.from("surveys").update({status:"closed",updated_at:new Date().toISOString()}).eq("id",currentSurvey.id);
    if (error) return showMessage(error.message,"error");
    await openEditor(currentSurvey.id);
    showMessage("回答受付を終了しました。","success");
  });
  $("copy-share-url").addEventListener("click",async()=>{
    try { await navigator.clipboard.writeText($("share-url").textContent); showMessage("回答用URLをコピーしました。","success"); }
    catch { showMessage("コピーできませんでした。URLを選択してコピーしてください。","error"); }
  });
  $("question-type").addEventListener("change",()=>{
    $("options-field").hidden = $("question-type").value === "text";
  });
  $("question-form").addEventListener("submit",async(event)=>{
    event.preventDefault();
    const type = $("question-type").value;
    const optionTexts = $("question-options").value.split("\n").map((s)=>s.trim()).filter(Boolean);
    if (type !== "text" && optionTexts.length < 2) return showMessage("選択式の質問には選択肢を2つ以上入力してください。","error");
    const position = currentQuestions.length ? Math.max(...currentQuestions.map((q)=>q.position))+1 : 0;
    const {data:question,error} = await client.from("questions").insert({
      survey_id:currentSurvey.id,
      question_text:$("question-text").value.trim(),
      question_type:type,
      is_required:$("question-required").checked,
      position
    }).select("id,survey_id,question_text,question_type,is_required,position").single();
    if (error) return showMessage(error.message,"error");
    if (type !== "text") {
      const {data:options,error:optionError} = await client.from("question_options").insert(optionTexts.map((option_text,index)=>({
        survey_id:currentSurvey.id,question_id:question.id,option_text,position:index
      }))).select("id,question_id,option_text,position");
      if (optionError) {
        await client.from("questions").delete().eq("id",question.id);
        return showMessage(optionError.message,"error");
      }
      question.options = options || [];
    } else question.options = [];
    currentQuestions.push(question);
    renderQuestionList();
    $("question-form").reset();
    $("options-field").hidden = false;
    showMessage("質問を追加しました。","success");
  });
  $("show-results-button").addEventListener("click",loadResults);
  $("export-csv").addEventListener("click",downloadCsv);

  async function init() {
    if (!window.supabase?.createClient) {
      showView("auth-view");
      return showMessage("Supabaseライブラリを読み込めませんでした。インターネット接続を確認してください。","error");
    }
    const token = new URLSearchParams(location.search).get("s");
    if (token) {
      await loadPublicSurvey(token);
      return;
    }
    const {data} = await client.auth.getSession();
    currentUser = data.session?.user || null;
    if (currentUser) await loadDashboard();
    else showView("auth-view");
  }
  init().catch((error)=>showMessage(error.message || "初期化に失敗しました。","error"));
})();