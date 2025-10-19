import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import { BASE_URL } from "./util/baseUrl";

if (module.hot) {
  module.hot.accept();
}

declare class Go {
  readonly importObject: any;
  run(instance: any);
}

const go = new Go();
WebAssembly.instantiateStreaming(
  fetch(`${BASE_URL}/wasm/barracks.wasm`),
  go.importObject
).then((result) => {
  go.run(result.instance);
  const container = document.getElementById("app") as HTMLElement;
  const root = createRoot(container);
  root.render(<App />);
});
