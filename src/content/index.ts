import { message } from "antd";

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === "executeScript") {
    try {
      // 使用 Function 构造器创建一个新的函数并立即执行
      const script = document.createElement("script");
      script.textContent = `(function(){${request.code}})()`;
      document.body.appendChild(script);
      document.body.removeChild(script);
      sendResponse({ success: true });
    } catch (error: any) {
      console.error("执行脚本时出错:", error);
      sendResponse({ success: false, error: error.message });
    }
  }
  if (request.action === "alertMessage") {
    console.log(request)
    if (request.type in message) {
      (message as any)[request.type](request.content);
    } else {
      console.error("无效的消息类型:", request.type);
    }
  }
  return true; // 保持消息通道开放
});

console.log("dynamic script plugin loaded 1");
