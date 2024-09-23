import {
  EditOutlined,
  PlayCircleOutlined,
  RocketOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Button, Divider, Empty, List, Switch, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { Script } from "../options/App";
import "./App.css";

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

  const alertMessage = (
    type: "success" | "error" | "info" | "warning",
    content: string
  ) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "alertMessage",
          type,
          content,
        });
      }
    });
  };

  const executeScript = (script: Script) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "executeScript", code: script.code },
          (response) => {
            if (response && response.success) {
              alertMessage("success", `脚本 "${script.name}" 已执行`);
            } else {
              alertMessage(
                "error",
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

  const renderList = (list: Script[], title: string) =>
    !!list.length && (
      <List
        header={<div className="text-left">{title}</div>}
        bordered
        itemLayout="horizontal"
        dataSource={list}
        renderItem={(script) => (
          <List.Item
            actions={[
              <Switch
                checked={script.autoRun}
                onChange={() => toggleScript(script.id)}
              />,
              <Tooltip title="执行脚本">
                <Button
                  icon={<PlayCircleOutlined />}
                  onClick={() => executeScript(script)}
                />
              </Tooltip>,
            ]}
          >
            <List.Item.Meta
              avatar={
                <div className="h-[50px] flex items-center justify-center">
                  {script.autoRun ? (
                    <ThunderboltOutlined
                      style={{ color: "#1890ff", fontSize: "24px" }}
                    />
                  ) : (
                    <RocketOutlined
                      style={{ color: "#52c41a", fontSize: "24px" }}
                    />
                  )}
                </div>
              }
              title={
                <Tooltip title={script.name}>
                  <div className="truncate max-w-[150px]">{script.name}</div>
                </Tooltip>
              }
              description={script.autoRun ? "自动执行" : "手动执行"}
            />
          </List.Item>
        )}
      />
    );

  return (
    <div className="p-4 bg-white" style={{ width: "360px" }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-left">脚本列表</h2>
        <EditOutlined
          className="text-lg cursor-pointer"
          onClick={() => chrome.runtime.openOptionsPage()}
        />
      </div>
      <Divider />
      {scripts.length > 0 ? (
        <>
          {renderList(
            scripts.filter((item) => item.autoRun),
            "自动执行"
          )}
          <br />
          {renderList(
            scripts.filter((item) => !item.autoRun),
            "手动执行"
          )}
        </>
      ) : (
        <Empty description="暂无脚本" style={{ marginBottom: "30px" }} />
      )}
    </div>
  );
}

export default App;
