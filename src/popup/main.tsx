import {
  StyleProvider,
  legacyLogicalPropertiesTransformer,
} from "@ant-design/cssinjs";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StyleProvider
      hashPriority="high"
      transformers={[legacyLogicalPropertiesTransformer]}
    >
      <App />
    </StyleProvider>
  </StrictMode>
);
