// This file now serves as a wrapper around the WebAssembly implementation

export function setFont(font) {
  try {
    const err = window.mb64.setFont(font);
    console.log("set font, error: ", err);
    return err;
  } catch (err) {
    console.error("Error in setFont:", err);
    throw new Error(`failed to set font: ${err.message}`);
  }
}

export function setFontSize(size) {
  try {
    const err = window.mb64.setFontSize(size);
    console.log("set fontSize, error: ", err);
    return err;
  } catch (err) {
    console.error("Error in setFontSize:", err);
    throw new Error(`failed to set font size: ${err.message}`);
  }
}

export function renderIn(uint8) {
  try {
    return window.mb64.renderIn(uint8);
  } catch (err) {
    console.error("Error in mb64.renderIn:", err);
    throw new Error(`mb64 renderIn failed: ${err.message}`);
  }
}

export function renderOut(b64) {
  try {
    return window.mb64.renderOut(b64);
  } catch (err) {
    console.error("Error in mb64.renderOut:", err);
    throw new Error(`mb64 renderOut failed: ${err.message}`);
  }
}
