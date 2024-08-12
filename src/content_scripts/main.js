// this can be substituted with a content script entry in manifest.json with "world": "MAIN"
// when targeting at least Firefox 128/Chromium 111
const initMainWorld = () =>
  new Promise((resolve) => {
    document.documentElement.addEventListener('extension-demo-injection-ready', resolve, {
      once: true,
    });

    const script = document.createElement('script');
    const scriptWithNonce = [...document.scripts].find((script) =>
      script.getAttributeNames().includes('nonce'),
    );
    if (scriptWithNonce) {
      script.nonce = scriptWithNonce.nonce;
    }

    script.src = browser.runtime.getURL('/main_world/index.js');
    document.documentElement.append(script);
  });

/**
 * Runs a script in the page's "main" execution environment and returns its result.
 * This permits access to variables exposed by the webpage javascript that are normally inaccessible
 * in the content script sandbox.
 * See the src/main_world directory and [../main_world/index.js](../main_world/index.js).
 * @param {string} path - Absolute path of script to inject (will be fed to `runtime.getURL()`)
 * @param {Array} [args] - Array of arguments to pass to the script
 * @param {Element} [target] - Target element; will be accessible as the `this` value in the injected function.
 * @returns {Promise<any>} The transmitted result of the script
 */
const inject = (path, args = [], target = document.documentElement) =>
  new Promise((resolve, reject) => {
    const requestId = String(Math.random());
    const data = { path: browser.runtime.getURL(path), args, id: requestId };

    const responseHandler = ({ detail }) => {
      const { id, result, exception } = JSON.parse(detail);
      if (id !== requestId) return;

      target.removeEventListener('extension-demo-injection-response', responseHandler);
      exception ? reject(exception) : resolve(result);
    };
    target.addEventListener('extension-demo-injection-response', responseHandler);

    target.dispatchEvent(
      new CustomEvent('extension-demo-injection-request', {
        detail: JSON.stringify(data),
        bubbles: true,
      }),
    );
  });

(async () => {
  await initMainWorld();

  const usesJQuery = await inject('/main_world/test_window.js', ['$']);
  console.log(`this site appears to ${usesJQuery ? 'use' : 'not use'} JQuery!`);

  const mainWorldWindowKeys = await inject('/main_world/get_all_window_keys.js');
  const sandboxWindowKeys = Object.keys(window);
  console.log(
    'the window object in the main world has unique keys:',
    mainWorldWindowKeys.filter((key) => !sandboxWindowKeys.includes(key)),
  );
  console.log(
    'the window object in the content script sandbox has unique keys:',
    sandboxWindowKeys.filter((key) => !mainWorldWindowKeys.includes(key)),
  );

  // getting an element's class from outside the extension sandbox is, of course,
  // pointless; this just demonstrates targeting an element
  const someElement = document.querySelector('[class]');
  console.log(
    'the element',
    someElement,
    'has class',
    await inject('/main_world/get_element_class.js'),
  );
})();
