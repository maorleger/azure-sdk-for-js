onmessage = (event: MessageEvent<any>) => {
  console.log(event);
  ((self as unknown) as Worker).postMessage(event);
};
