import { JSDOM } from "jsdom";

let { window } = new JSDOM();
globalThis.document = window.document;
globalThis.DOMParser = window.DOMParser;
globalThis.XMLSerializer = window.XMLSerializer;
globalThis.Node = window.Node;
