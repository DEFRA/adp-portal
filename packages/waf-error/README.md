This package is intended to be used to create the static waf-error page.
For now, this has been done by starting the site in light mode, manually taking a copy of the HTML, and then doing the same in dark mode.
The styles for each can then be trimmed down using this code:

```js
[...document.styleSheets]
  .flatMap(s => [...s.rules])
  .filter(function isRuleUsed(rule) {
    if (rule instanceof CSSStyleRule) {
      // Remove unused styles
      return document.querySelectorAll(rule.selectorText).length > 0;
    }
    if (rule instanceof CSSMediaRule) {
      // Only include media rules if their contents are applicable
      return [...rule.cssRules].some(isRuleUsed);
    }
    if (rule instanceof CSSFontFaceRule) {
      // Always include the font rules
      return true;
    }
    return false;
  })
  .map(rule => rule.cssText)
  .join('\n\n');
```

Once each set of styles has been trimmed, remove any references to `http://localhost:3000/`. This should only occur in @font-face css rules, and the header &lt;link&gt;s

```
old:
url('http://localhost:3000/static/light-f591b13f7d-v2.f03d82c283b021916f42.woff2')

new:
url('/static/light-f591b13f7d-v2.f03d82c283b021916f42.woff2')
```

Next, compare the dark and light mode html files and copy any changes from the dark styles to the light styles while wrapping them in the following snippet:

```css
@media (prefers-color-scheme: dark) {
  /* dark theme styles here */
}
```

Once completed, it can be minified using this command:

```
npx html-minifier-terser --collapse-whitespace --minify-css true my-html-file.html > waf-error.html
```
