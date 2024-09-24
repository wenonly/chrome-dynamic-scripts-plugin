// 添加消息监听器
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === "getScriptData") {
    console.log("收到获取脚本数据的请求");
    chrome.storage.sync.get("scripts", (result) => {
      sendResponse({ scriptData: result.scripts || [] });
    });
    return true; // 表示异步发送响应
  }
});
