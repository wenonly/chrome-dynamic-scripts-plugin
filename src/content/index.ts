import { message } from "antd";

// iframe中不执行
if (window === window.top) {
  // 执行脚本
  function executeScript(code: string) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const messageName = "error_" + Math.floor(Math.random() * 100000);
      const handler = (e: Event) => reject((e as CustomEvent).detail);
      window.addEventListener(messageName, handler);
      script.textContent = `(function(){
          try {
            ${code}
          } catch(e) {
            window.dispatchEvent(new CustomEvent('${messageName}', { detail: e }));
          }
      })()`;
      document.body.appendChild(script);
      document.body.removeChild(script);
      window.removeEventListener(messageName, handler);
      resolve(true);
    });
  }

  chrome.runtime.onMessage.addListener(async (request, _, sendResponse) => {
    if (request.action === "executeScript") {
      try {
        await executeScript(request.code);
        sendResponse({ success: true });
      } catch (error: any) {
        console.error("执行脚本时出错:", error);
        sendResponse({ success: false, error: error.message });
      }
    }
    if (request.action === "alertMessage") {
      if (request.type in message) {
        (message as any)[request.type](request.content);
      } else {
        console.error("无效的消息类型:", request.type);
      }
    }
    return true; // 保持消息通道开放
  });
}
