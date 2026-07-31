import { renderMarkdown, markdownToPlainText } from './markdown.js';

export function splitMarkdownSections(markdown) {
  const lines = String(markdown ?? '').split(/\r?\n/);
  const sections = [];
  let current = { title: '', level: 0, lines: [] };

  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      if (current.title || current.lines.some((item) => item.trim())) sections.push(current);
      current = { title: heading[2].trim(), level: heading[1].length, lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.title || current.lines.some((item) => item.trim())) sections.push(current);
  return sections;
}

function isSummaryTitle(title) {
  return /^(resumo|resposta direta|conclusão breve)/i.test(String(title).trim());
}

export function renderStructuredAnswer(markdown, { compact = false } = {}) {
  const sections = splitMarkdownSections(markdown);
  if (sections.length <= 1 || !sections.some((section) => section.title)) return renderMarkdown(markdown);

  return sections.map((section, index) => {
    const body = renderMarkdown(section.lines.join('\n').trim());
    if (!section.title) return `<div class="response-section">${body}</div>`;
    const safeTitle = renderMarkdown(`**${section.title}**`).replace(/^<p>|<\/p>$/g, '');
    if (isSummaryTitle(section.title) || index === 0) {
      return `<section class="response-section summary-card"><h3>${safeTitle}</h3>${body}</section>`;
    }
    const open = compact ? '' : ' open';
    return `<section class="response-section"><details${open}><summary>${safeTitle}</summary><div class="section-body">${body}</div></details></section>`;
  }).join('');
}

export function answerToShareText(answer) {
  return markdownToPlainText(answer).trim();
}
