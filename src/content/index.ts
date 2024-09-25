import { message } from "antd";
import { Script } from "../options/App";
import { minimatch } from "minimatch";

// iframe中不执行
if (window === window.top) {
  // 执行脚本
  function executeScript(code: string) {
    const script = document.createElement("script");
    script.textContent = `(function(){${code}})()`;
    document.body.appendChild(script);
    document.body.removeChild(script);
  }

  chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
    if (request.action === "executeScript") {
      try {
        executeScript(request.code);
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
      waitBody(() => {
        autoScripts?.forEach((item) => {
          try {
            executeScript(item.code);
            message.success(`脚本 ${item.name} 已执行`);
          } catch (error) {
            console.error(error);
            message.error(`脚本 ${item.name} 执行失败`);
          }
        });
      });
    } else {
      console.error("获取脚本数据失败");
    }
  });

  console.log("脚本狗子插件已加载完成。");
}
