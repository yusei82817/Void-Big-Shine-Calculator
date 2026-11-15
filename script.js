(() => {
"use strict";
const input=document.getElementById("expression"),termsInput=document.getElementById("terms"),result=document.getElementById("result"),detail=document.getElementById("detail"),status=document.getElementById("status"),calculateButton=document.getElementById("calculate"),cancelButton=document.getElementById("cancel");
let worker=null,sequence=0;
function setBusy(busy){calculateButton.disabled=busy;cancelButton.hidden=!busy;status.textContent=busy?"RUNNING":"READY";}
function stopWorker(){if(worker){worker.terminate();worker=null;}setBusy(false);}
function calculate(){
 const expression=input.value.trim();
 if(!expression){result.textContent="数式を入力してね";detail.textContent="式を入力するか、クイック入力を選んでね。";return;}
 const raw=Number(termsInput.value||1000),maxTerms=Math.min(50000,Math.max(10,Number.isFinite(raw)?Math.floor(raw):1000));
 termsInput.value=String(maxTerms);
 stopWorker();
 const id=++sequence;
 try{
  worker=new Worker("./worker.js");
  setBusy(true);status.textContent="RUNNING";result.textContent="計算中…";detail.textContent="別スレッドで計算しているよ。画面操作は続けられる。";
  worker.onmessage=event=>{
   if(event.data.id!==id)return;
   worker.terminate();worker=null;setBusy(false);
   if(event.data.ok){result.textContent=event.data.result;detail.textContent=event.data.detail;status.textContent="SUCCESS";}
   else{result.textContent="計算できませんでした";detail.textContent=event.data.error;status.textContent="ERROR";}
  };
  worker.onerror=event=>{worker?.terminate();worker=null;setBusy(false);result.textContent="計算エラー";detail.textContent="Workerを起動できなかったか、スクリプトに問題があるよ。";status.textContent="ERROR";};
  worker.postMessage({id,expression,maxTerms});
 }catch(error){setBusy(false);result.textContent="Workerを起動できません";detail.textContent=error.message;status.textContent="ERROR";}
}
calculateButton.addEventListener("click",calculate);
cancelButton.addEventListener("click",()=>{stopWorker();result.textContent="計算を中止したよ";detail.textContent="処理を終了しました。";status.textContent="CANCELLED";});
input.addEventListener("keydown",event=>{if(event.key==="Enter")calculate();});
document.querySelectorAll("[data-expression]").forEach(button=>button.addEventListener("click",()=>{input.value=button.dataset.expression;input.focus();calculate();}));

const translationPairs=[
 {input:document.getElementById("ja-input"),output:document.getElementById("ja-output"),button:document.getElementById("ja-translate"),status:document.getElementById("ja-status"),lang:"ja|en"},
 {input:document.getElementById("en-input"),output:document.getElementById("en-output"),button:document.getElementById("en-translate"),status:document.getElementById("en-status"),lang:"en|ja"}
];
translationPairs.forEach(pair=>{
 pair.button.addEventListener("click",async()=>{
  const source=pair.input.value.trim();
  if(!source){pair.status.textContent="翻訳する文章を入力してください。";return;}
  if(source.length>5000){pair.status.textContent="文章は5,000文字以内にしてください。";return;}
  pair.button.disabled=true;
  pair.status.textContent="翻訳中…";
  try{
   const url="https://api.mymemory.translated.net/get?q="+encodeURIComponent(source)+"&langpair="+pair.lang;
   const response=await fetch(url);
   if(!response.ok) throw new Error("翻訳サービスとの通信に失敗しました。");
   const data=await response.json();
   if(data.responseStatus!==200 || !data.responseData?.translatedText) throw new Error(data.responseDetails||"翻訳結果を取得できませんでした。");
   const decoded=document.createElement("textarea");
   decoded.innerHTML=data.responseData.translatedText;
   pair.output.value=decoded.value;
   pair.status.textContent="翻訳完了";
  }catch(error){
   pair.status.textContent="翻訳エラー："+(error.message||"通信を確認してください。");
  }finally{
   pair.button.disabled=false;
  }
 });
});

})();