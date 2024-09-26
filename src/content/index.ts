import { message } from "antd";
import { minimatch } from "minimatch";
import { Script } from "../options/App";

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

  function waitBody(callback: () => void) {
    if (document.body) {
      callback();
      return;
    }
    const listen = () => {
      document.removeEventListener("load", listen, false);
      document.removeEventListener("DOMContentLoaded", listen, false);
      waitBody(callback);
    };
    document.addEventListener("load", listen, false);
    document.addEventListener("DOMContentLoaded", listen, false);
  }

  // 添加新的消息监听器来请求脚本数据
  chrome.runtime.sendMessage({ action: "getScriptData" }, (response) => {
    if (response) {
      // 在这里处理接收到的脚本数据
      const scriptData: Script[] = response.scriptData;
      const autoScripts = scriptData.filter(
        (item) =>
          item.autoRun &&
          (item.match ? minimatch(window.location.href, item.match) : true)
      );
      waitBody(async () => {
        for (const item of autoScripts) {
          try {
            await executeScript(item.code);
            message.success(`脚本 ${item.name} 已执行`);
          } catch (error) {
            console.error(error);
            message.error(`脚本 ${item.name} 执行失败`);
          }
        }
      });
    } else {
      console.error("获取脚本数据失败");
    }
  });
}
