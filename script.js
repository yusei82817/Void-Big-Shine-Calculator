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


const arcRadius=document.getElementById("arc-radius");
const arcAngle=document.getElementById("arc-angle");
const arcCalculate=document.getElementById("arc-calculate");
const arcResult=document.getElementById("arc-result");
const arcDetail=document.getElementById("arc-detail");
if(arcCalculate){
 arcCalculate.addEventListener("click",()=>{
  const radiusText=arcRadius.value.trim(),angleText=arcAngle.value.trim();
  if(radiusText===""||angleText===""){
   arcResult.textContent="入力が不足しています";
   arcDetail.textContent="半径と中央角の両方を入力してください。";
   return;
  }
  const radius=Number(radiusText),angle=Number(angleText);
  if(!Number.isFinite(radius)||radius<0){
   arcResult.textContent="半径を確認してください";
   arcDetail.textContent="半径は0以上の有限な数値で入力してください。";
   arcRadius.focus();return;
  }
  if(!Number.isFinite(angle)||angle<0||angle>360){
   arcResult.textContent="中央角を確認してください";
   arcDetail.textContent="中央角は0°以上360°以下で入力してください。";
   arcAngle.focus();return;
  }
  const length=radius*(2*Math.PI*angle/360);
  if(!Number.isFinite(length)){
   arcResult.textContent="数値の範囲を超えています";
   arcDetail.textContent="半径を小さくして再計算してください。";
   return;
  }
  const formatted=Number(length.toPrecision(12)).toString();
  arcResult.textContent=formatted;
  arcDetail.textContent="L = 2π × "+radius+" × "+angle+" / 360 = "+formatted+"。単位は半径と同じです。";
 });
}

const installButton=document.getElementById("install-app");
let deferredInstallPrompt=null;
if(installButton){
 window.addEventListener("beforeinstallprompt",event=>{
  event.preventDefault();
  deferredInstallPrompt=event;
  installButton.hidden=false;
 });
 installButton.addEventListener("click",async()=>{
  if(!deferredInstallPrompt)return;
  const promptEvent=deferredInstallPrompt;
  deferredInstallPrompt=null;
  installButton.disabled=true;
  try{
   await promptEvent.prompt();
   const choice=await promptEvent.userChoice;
   installButton.hidden=true;
   if(choice.outcome==="accepted")installButton.textContent="インストール済み";
  }catch(error){
   console.error("PWA install prompt failed:",error);
  }finally{
   installButton.disabled=false;
  }
 });
 window.addEventListener("appinstalled",()=>{
  deferredInstallPrompt=null;
  installButton.hidden=true;
 });
}

})();