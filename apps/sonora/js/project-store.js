const DB_NAME = "sonora-studio";
const DB_VERSION = 1;
const STORE_NAME = "projects";

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("このブラウザではIndexedDBを利用できません。"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("データベースを開けませんでした。"));
  });
}

export async function saveProject(project) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ ...project, id: "current", updatedAt: new Date().toISOString() });
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error("保存に失敗しました。")); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error("保存が中断されました。")); };
  });
}

export async function loadProject() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get("current");
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("プロジェクトを読み込めませんでした。"));
    tx.oncomplete = () => db.close();
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
