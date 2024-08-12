# Web Extension Sandbox Demo

This is a minimal demo for the "inject" code used to communicate between the web extension content script sandbox and the "main world" javascript context in [XKit Rewritten](https://github.com/AprilSylph/XKit-Rewritten). See ["Content script environment" on MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#content_script_environment) for some background on these concepts. It is a cross-browser Manifest V3 extension and should work in Firefox, Chromium-based browsers, and Safari (when converted via `xcrun safari-web-extension-converter`).

This branch contains a version of our full setup, in which script files in `src/main_world` contain functions that can be run in the page context. The content script can call `inject()` with the path to one of these function files, which will return the result of executing the function in question in the page context. This can be used to access variables added to `window` by page javascript; a demo function here queries whether the page is using JQuery.

At time of writing, this branch includes a manual script injection used to work around the lack of `"world": "MAIN"` support in `manifest.json` in versions of Firefox prior to 128 ESR; those supporting only new browsers can simplify this significantly _(todo: make a branch demonstrating this)_.

There are a number of ways to communicate between the sandboxed and main worlds in a cross-browser-compatible way, such as calling `postMessage`, creating and observing DOM mutations with a `MutationObserver`, and creating and listening for a `CustomEvent`.

- `postMessage` is "slow" in the sense that the event loop will end and the browser will be allowed to repaint between the message being sent and received. This can create visiual jank when performing DOM mutations based on an "injected" function's result and is not desirable.
- Creating a DOM mutation (such as setting a data attribute) and observing the result with a `MutationObserver` is "fast." It limits one to passing data that serializes to text, however, and the mutation may be observed by other code.
- Creating and dispatching a `CustomEvent` with payload data is "fast," relatively clean, includes an ergonomic way of targeting a certain DOM element with a function, and also allows sending certain non-serializable values\*. This should, in my opinion, be the main documented way to perform this communication.

\*_May require calling `cloneInto()` in Firefox; see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts and test your code in the Firefox versions you want to support if you make use of this._
