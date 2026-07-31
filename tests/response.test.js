import test from 'node:test';
import assert from 'node:assert/strict';
import { answerToShareText, renderStructuredAnswer, splitMarkdownSections } from '../public/response.js';

test('separa resposta por títulos Markdown', () => {
  const sections = splitMarkdownSections('## Resumo\nCurto.\n\n## Observação direta\n- Item');
  assert.equal(sections.length, 2);
  assert.equal(sections[0].title, 'Resumo');
  assert.equal(sections[1].title, 'Observação direta');
});

test('mantém resumo visível e recolhe detalhes no compacto', () => {
  const html = renderStructuredAnswer('## Resumo\nCurto.\n\n## Observação direta\n- Item', { compact: true });
  assert.match(html, /summary-card/);
  assert.match(html, /<details>/);
  assert.doesNotMatch(html, /<details open>/);
});

test('abre detalhes no modo desktop', () => {
  const html = renderStructuredAnswer('## Resumo\nCurto.\n\n## Interpretação\nTexto.', { compact: false });
  assert.match(html, /<details open>/);
});

test('gera texto limpo para compartilhamento', () => {
  assert.equal(answerToShareText('## Resumo\n- **Teste**'), 'Resumo\n• Teste');
});
