// getting an element's class from outside the extension sandbox is, of course,
// pointless; this just demonstrates targeting an element
export default function getElementClass() {
  const targetElement = this;

  return targetElement.getAttribute('class');
}
