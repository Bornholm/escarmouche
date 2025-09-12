import { createRoot } from "react-dom/client";
import { App } from "./components/App";

declare class Go {
  readonly importObject: any;
  run(instance: any);
}

const go = new Go();
WebAssembly.instantiateStreaming(fetch("barracks.wasm"), go.importObject).then(
  (result) => {
    go.run(result.instance);
    const container = document.getElementById("app") as HTMLElement;
    const root = createRoot(container);
    root.render(<App />);
  }
);
