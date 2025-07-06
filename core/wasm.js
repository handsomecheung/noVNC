import * as Log from "./util/logging.js";
import { setFont, renderIn, renderOut } from "./mb64.js";

export class WASM {
  constructor() {
    this._go = null;
    this._wasmModule = null;
    this._isReady = false;
    this._wasmUrl = null;
    this._wasmExecUrl = null;
  }

  static async from(wasmUrl, wasmExecUrl) {
    const defaultFont = "Zen Kurenaido";
    let font = localStorage.getItem("font");
    if (!font) {
      font = defaultFont;
    }

    const wasm = new WASM();
    await wasm.initialize(font, wasmUrl, wasmExecUrl);
    return wasm;
  }

  async initialize(font, wasmUrl, wasmExecUrl) {
    try {
      this._wasmUrl = wasmUrl;
      this._wasmExecUrl = wasmExecUrl;

      await this._loadGoWasmRuntime();
      await this._loadWasmModule();

      const fontError = setFont(font);
      if (fontError) {
        Log.Warn("Font setting returned error: " + fontError);
      }

      this._isReady = true;

      Log.Info("Go WebAssembly initialized successfully with mb64");
    } catch (err) {
      Log.Error("Failed to initialize Go WASM: " + err.message);
      throw err;
    }
  }

  async _loadGoWasmRuntime() {
    try {
      Log.Info(`Loading Go WASM runtime from: ${this._wasmExecUrl}`);

      // Dynamically import wasm_exec.js
      const script = document.createElement("script");
      script.src = this._wasmExecUrl;

      return new Promise((resolve, reject) => {
        script.onload = () => {
          if (typeof Go !== "undefined") {
            this._go = new Go();
            Log.Info("Go WASM runtime loaded successfully");
            resolve();
          } else {
            reject(
              new Error("Go runtime not available after loading wasm_exec.js"),
            );
          }
        };
        script.onerror = () => reject(new Error("Failed to load wasm_exec.js"));
        document.head.appendChild(script);
      });
    } catch (err) {
      Log.Error("Failed to load Go WASM runtime: " + err.message);
      throw err;
    }
  }

  async _loadWasmModule() {
    try {
      Log.Info(`Loading Go WebAssembly module from: ${this._wasmUrl}`);

      const wasmResponse = await fetch(this._wasmUrl);
      if (!wasmResponse.ok) {
        throw new Error(
          `Failed to fetch WASM file: ${wasmResponse.status} ${wasmResponse.statusText}`,
        );
      }

      const wasmBytes = await wasmResponse.arrayBuffer();
      const wasmModule = await WebAssembly.instantiate(
        wasmBytes,
        this._go.importObject,
      );

      this._wasmModule = wasmModule;

      // Run the Go program
      this._go.run(wasmModule.instance);

      Log.Info("Go WebAssembly module loaded and executed successfully");
    } catch (err) {
      Log.Error("Failed to load Go WASM module: " + err.message);
      throw err;
    }
  }

  async encode(data) {
    if (!this.isReady()) {
      throw new Error("WASM not initialized");
    }

    try {
      const encoded = renderIn(data);
      const encodedArray = new Uint8Array(encoded.length);
      for (let i = 0; i < encoded.length; i++) {
        encodedArray[i] = encoded.charCodeAt(i);
      }

      return encodedArray;
    } catch (err) {
      Log.Error("WASM encode error: " + err.message);
      throw err;
    }
  }

  async decode(data) {
    if (!this.isReady()) {
      throw new Error("WASM not initialized");
    }

    try {
      const inputString = String.fromCharCode.apply(null, data);
      const decodedArray = renderOut(inputString);
      return decodedArray;
    } catch (err) {
      Log.Error("WASM decode error: " + err.message);
      throw err;
    }
  }

  isReady() {
    return this._isReady && this._wasmModule !== null;
  }
}
