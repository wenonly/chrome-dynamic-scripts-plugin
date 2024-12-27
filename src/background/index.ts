import { getScriptsFromStorage } from "../utils/storageHelper";

// 添加消息监听器
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === "getScriptData") {
    console.log("收到获取脚本数据的请求");
    getScriptsFromStorage().then((scripts) => {
      sendResponse({ scriptData: scripts });
    });
    return true; // 表示异步发送响应
  }
});
