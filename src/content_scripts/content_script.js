globalThis.browser ??= globalThis.chrome;

import(browser.runtime.getURL(`/content_scripts/main.js`));
