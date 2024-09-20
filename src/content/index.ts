chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === "executeScript") {
    try {
      // 使用 Function 构造器创建一个新的函数并立即执行
      const script = document.createElement("script");
      script.textContent = request.code;
      document.body.appendChild(script);
      document.body.removeChild(script);
      sendResponse({ success: true });
    } catch (error: any) {
      console.error("执行脚本时出错:", error);
      sendResponse({ success: false, error: error.message });
    }
  }
  return true; // 保持消息通道开放
});

console.log("content script loaded");