import type { Script } from "../options/App";

export function getScriptsFromStorage() {
  return new Promise<Script[]>((resolve, reject) => {
    if (!chrome.storage?.local) return reject("no storage local");
    chrome.storage.local.get(null, (result) => {
      try {
        console.log("result", result);
        const scriptKeys = Object.keys(result).filter((key) =>
          key.startsWith("__script_")
        );
        const scripts: Script[] = scriptKeys.map((key) => {
          const script = result[key];
          return {
            ...script,
            code: decodeURIComponent(atob(script.code)),
          };
        });
        resolve(scripts);
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function setScriptsToStorage(scripts: Script[]) {
  if (!chrome.storage.local) throw new Error("no storage local");
  try {
    console.log("updateScripts", scripts);
    const updatedScripts = scripts.map((s) => ({
      ...s,
      code: btoa(encodeURIComponent(s.code)),
    }));
    await chrome.storage.local.clear();
    for (const script of updatedScripts) {
      await chrome.storage.local.set({
        ["__script_" + script.id]: script,
      });
    }
  } catch (error) {
    console.error(error);
  }
}
