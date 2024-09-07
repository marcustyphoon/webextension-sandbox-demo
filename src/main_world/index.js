'use strict';

{
  const moduleCache = {};

  window.removeExtensionDemoListener?.();

  const controller = new AbortController();
  window.removeExtensionDemoListener = () => controller.abort();

  document.documentElement.addEventListener(
    'extension-demo-injection-request',
    async (event) => {
      const { detail, target } = event;
      const { id, path, args } = JSON.parse(detail);

      try {
        moduleCache[path] ??= await import(path);
        const func = moduleCache[path].default;

        if (target.isConnected === false) return;

        const result = await func.apply(target, args);
        target.dispatchEvent(
          new CustomEvent('extension-demo-injection-response', {
            detail: JSON.stringify({ id, result }),
          }),
        );
      } catch (exception) {
        target.dispatchEvent(
          new CustomEvent('extension-demo-injection-response', {
            detail: JSON.stringify({
              id,
              exception: {
                message: exception.message,
                name: exception.name,
                stack: exception.stack,
                ...exception,
              },
            }),
          }),
        );
      }
    },
    { signal: controller.signal },
  );

  document.documentElement.dispatchEvent(new CustomEvent('extension-demo-injection-ready'));
}
