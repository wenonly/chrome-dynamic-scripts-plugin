import { javascript } from "@codemirror/lang-javascript";
import CodeMirror from "@uiw/react-codemirror";
import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Popconfirm,
  Table,
  message,
  Layout,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import "./App.css";

export interface Script {
  id: number;
  name: string;
  code: string;
  autoRun: boolean;
  match?: string;
}

function App() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get("scripts", (result) => {
        if (result.scripts) {
          setScripts(result.scripts);
        }
      });
    } else {
      console.warn("chrome.storage.sync 不可用");
    }
  }, []);

  const saveScripts = (updatedScripts: Script[]) => {
    setScripts(updatedScripts);
    if (chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ scripts: updatedScripts });
    }
  };

  const showModal = (script: Script | null) => {
    setEditingScript(script);
    if (script) {
      form.setFieldsValue(script);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      const updatedScripts = editingScript
        ? scripts.map((s) =>
            s.id === editingScript.id ? { ...s, ...values } : s
          )
        : [...scripts, { ...values, id: Date.now() }];
      saveScripts(updatedScripts);
      setIsModalVisible(false);
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const deleteScript = (id: number) => {
    const updatedScripts = scripts.filter((script) => script.id !== id);
    saveScripts(updatedScripts);
  };

  const exportScripts = () => {
    const scriptsWithEncodedCode = scripts.map((script) => ({
      ...script,
      code: btoa(script.code),
    }));
    const dataStr = JSON.stringify(scriptsWithEncodedCode);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "scripts_export.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const importScripts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedScripts: Script[] = JSON.parse(
            e.target?.result as string
          );
          const scriptsWithDecodedCode = importedScripts.map((script) => ({
            ...script,
            code: atob(script.code),
          }));
          saveScripts(scriptsWithDecodedCode);
          message.success("脚本导入成功");
        } catch (error) {
          message.error("导入失败，请检查文件格式");
        }
      };
      reader.readAsText(file);
    }
  };

  const columns: ColumnsType<Script> = [
    {
      title: "脚本名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "自动执行",
      dataIndex: "autoRun",
      key: "autoRun",
      render: (autoRun: boolean) => (autoRun ? "是" : "否"),
    },
    {
      title: "URL匹配",
      dataIndex: "match",
      key: "match",
      render: (match: string) => match || "未配置",
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <span>
          <Button onClick={() => showModal(record)}>编辑</Button>
          <Popconfirm
            title="确定要删除这个脚本吗？"
            onConfirm={() => deleteScript(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button style={{ marginLeft: 8 }}>删除</Button>
          </Popconfirm>
        </span>
      ),
    },
  ];

  return (
    <Layout className="App" style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ 
        background: '#1890ff', 
        padding: '0 20px', 
        display: 'flex', 
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <img src="/icons/icon128.png" alt="Logo" style={{ width: 40, height: 40, marginRight: 16 }} />
        <Typography.Title level={3} style={{ margin: 0, color: '#fff' }}>脚本狗子配置</Typography.Title>
      </Layout.Header>
      <Layout.Content style={{ padding: '24px', backgroundColor: '#f0f2f5' }}>
        <div style={{ 
          background: '#fff', 
          padding: '24px', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
        }}>
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <Button type="primary" onClick={() => showModal(null)} style={{ marginRight: 8 }}>
                添加脚本
              </Button>
              <Button onClick={exportScripts} style={{ marginRight: 8 }}>
                导出脚本
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={importScripts}
                style={{ display: "none" }}
                id="import-scripts"
              />
              <Button onClick={() => document.getElementById("import-scripts")?.click()}>
                导入脚本
              </Button>
            </div>
            <Typography.Text type="secondary">
              共 {scripts.length} 个脚本
            </Typography.Text>
          </div>
          <Table 
            columns={columns} 
            dataSource={scripts} 
            rowKey="id" 
            pagination={{ pageSize: 10 }}
            bordered
            style={{ backgroundColor: '#fff' }}
          />
        </div>
      </Layout.Content>
      <Modal
        title={editingScript ? "编辑脚本" : "添加脚本"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={"70vw"}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="脚本名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="脚本代码" rules={[{ required: true }]}>
            <CodeMirror
              value={form.getFieldValue("code")}
              height="200px"
              extensions={[javascript({ jsx: true })]}
              onChange={(value) => form.setFieldsValue({ code: value })}
            />
          </Form.Item>
          <Form.Item name="autoRun" valuePropName="checked">
            <Checkbox>自动执行</Checkbox>
          </Form.Item>
          <Form.Item
            name="match"
            label="URL匹配（留空表示所有页面，用于自动执行时匹配网页）"
            dependencies={["autoRun"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!getFieldValue("autoRun") || value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("自动执行时必须填写URL匹配规则")
                  );
                },
              }),
            ]}
          >
            <Input placeholder="例如: https://*.example.com/*" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default App;
