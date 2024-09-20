import { useState, useEffect } from "react";
import { Button, List, Switch, message } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  PlayCircleOutlined,
} from "@ant-design/icons";
import "./App.css";
import { Script } from "../options/App";

function App() {
  const [scripts, setScripts] = useState<Script[]>([]);

  // 添加 toggleScript 函数
  const toggleScript = (id: number) => {
    const updatedScripts = scripts.map((script) =>
      script.id === id ? { ...script, autoRun: !script.autoRun } : script
    );
    setScripts(updatedScripts);
    // 可能需要更新 Chrome 存储
    chrome.storage.sync.set({ scripts: updatedScripts });
  };

  useEffect(() => {
    chrome.storage.sync.get("scripts", (result) => {
      if (result.scripts) {
        setScripts(result.scripts);
      }
    });
  }, []);

  const executeScript = (script: Script) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "executeScript", code: script.code },
          (response) => {
            if (response && response.success) {
              message.success(`脚本 "${script.name}" 已执行`);
            } else {
              message.error(
                `执行脚本 "${script.name}" 时出错: ${
                  response?.error || "未知错误"
                }`
              );
            }
          }
        );
      }
    });
  };

  return (
    <div className="p-4 bg-white" style={{ width: "300px" }}>
      <h2 className="text-lg font-bold mb-4">脚本列表</h2>
      <List
        itemLayout="horizontal"
        dataSource={scripts}
        renderItem={(script) => (
          <List.Item
            actions={[
              <Switch
                checked={script.autoRun}
                onChange={() => toggleScript(script.id)}
              />,
              <Button
                icon={<PlayCircleOutlined />}
                onClick={() => executeScript(script)}
              />,
            ]}
          >
            <List.Item.Meta
              avatar={
                script.autoRun ? (
                  <CheckCircleFilled style={{ color: "#52c41a" }} />
                ) : (
                  <CloseCircleFilled style={{ color: "#ff4d4f" }} />
                )
              }
              title={script.name}
              description={script.autoRun ? "自动执行" : "手动执行"}
            />
          </List.Item>
        )}
      />
    </div>
  );
}

export default App;
