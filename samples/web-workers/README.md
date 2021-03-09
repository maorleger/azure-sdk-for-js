# Using the Azure SDK for JS in Web Workers

Using the Azure SDK in Node or browsers' main process is supported out of the box.
When using the Azure SDK in other runtimes a polyfill may be necessary.

In this sample we demonstrate how to polyfill the necessary APIs for using our libraries in web workers.

> Web Workers are a simple means for web content to run scripts in background threads. Please see [this documentation][webworkers] for more information on Web Workers.

## Known required polyfills

The Azure SDK for JS is _generally_ supported in Web Workers, with a few exceptions that require polyfills. The sections below will provide a brief description of each dependency and the approach to support it.

### XML Parsing

When used in the browser, our XML parsing library relies on DOM APIs to support parsing and stringifying XML. Since the DOM APIs are generally available this reduces bundle size and minimizes our dependencies. When running from a Web Worker, however, DOM APIs are not available. This is a browser limitation and requires a polyfill for various DOM APIs before importing our client libraries in web workers.

> Note: Not all client libraries use XML. When running in a web worker, our library will emit a useful error explaining what APIs are required if they are missing so that you can add them as needed.

In these samples we used `JSDOM` but you can use any library that provides a DOM implementation.

[webworkers]: https://developer.mozilla.org/docs/Web/API/Web_Workers_API
