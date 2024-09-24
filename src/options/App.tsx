import { javascript } from "@codemirror/lang-javascript";
import CodeMirror from "@uiw/react-codemirror";
import { Button, Checkbox, Form, Input, Modal, Popconfirm, Table } from "antd";
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
      render: (match: string) => match || "所有页面",
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
    <div className="App">
      <h1>脚本配置</h1>
      <Button onClick={() => showModal(null)} style={{ marginBottom: 16 }}>
        添加脚本
      </Button>
      <Table columns={columns} dataSource={scripts} rowKey="id" />
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
            label="URL匹配（留空表示所有页面）"
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
    </div>
  );
}

export default App;
