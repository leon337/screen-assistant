import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown, markdownToPlainText } from '../public/markdown.js';

test('renderiza títulos, negrito e listas', () => {
  const html = renderMarkdown('# Título\n\n- **Item**\n- Outro');
  assert.match(html, /<h1>Título<\/h1>/);
  assert.match(html, /<ul>/);
  assert.match(html, /<strong>Item<\/strong>/);
});

test('escapa HTML potencialmente perigoso', () => {
  const html = renderMarkdown('<script>alert(1)</script>');
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

test('bloqueia links com protocolo javascript', () => {
  const html = renderMarkdown('[clique](javascript:alert(1))');
  assert.doesNotMatch(html, /href="javascript:/);
  assert.match(html, /clique/);
});

test('preserva blocos de código com escape', () => {
  const html = renderMarkdown('```js\nconst x = "<tag>";\n```');
  assert.match(html, /<pre><code class="language-js">/);
  assert.match(html, /&lt;tag&gt;/);
});

test('converte Markdown para texto puro para cópia e voz', () => {
  const text = markdownToPlainText('## Título\n\n- **Item** com `código`');
  assert.equal(text, 'Título\n• Item com código');
});
