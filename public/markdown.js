const CODE_TOKEN_PREFIX = '\u0000CODE_';

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeHref(rawUrl) {
  const value = String(rawUrl ?? '').trim();
  if (!value) return '#';

  try {
    const parsed = new URL(value, 'https://screen-assistant.invalid');
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) return '#';
    return escapeHtml(value);
  } catch {
    return '#';
  }
}

function renderInline(input) {
  const codeTokens = [];
  let value = String(input ?? '').replace(/`([^`\n]+)`/g, (_, code) => {
    const token = `${CODE_TOKEN_PREFIX}${codeTokens.length}\u0000`;
    codeTokens.push(`<code>${escapeHtml(code)}</code>`);
    return token;
  });

  value = escapeHtml(value);
  value = value.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
    const href = safeHref(url);
    if (href === '#') return escapeHtml(label);
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
  });
  value = value.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  value = value.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
  value = value.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  value = value.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>');

  for (let index = 0; index < codeTokens.length; index += 1) {
    const token = escapeHtml(`${CODE_TOKEN_PREFIX}${index}\u0000`);
    value = value.replaceAll(token, codeTokens[index]);
  }

  return value;
}

function closeList(state, output) {
  if (!state.listType) return;
  output.push(`</${state.listType}>`);
  state.listType = null;
}

function closeParagraph(state, output) {
  if (!state.paragraph.length) return;
  output.push(`<p>${renderInline(state.paragraph.join(' '))}</p>`);
  state.paragraph = [];
}

export function renderMarkdown(markdown) {
  const lines = String(markdown ?? '').replaceAll('\r\n', '\n').split('\n');
  const output = [];
  const state = { listType: null, paragraph: [] };
  let inCode = false;
  let codeLanguage = '';
  let codeLines = [];

  const flushBlocks = () => {
    closeParagraph(state, output);
    closeList(state, output);
  };

  for (const rawLine of lines) {
    const line = rawLine ?? '';
    const fence = line.match(/^```\s*([\w-]*)\s*$/);

    if (fence) {
      if (inCode) {
        const languageClass = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : '';
        output.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        inCode = false;
        codeLanguage = '';
        codeLines = [];
      } else {
        flushBlocks();
        inCode = true;
        codeLanguage = fence[1] || '';
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushBlocks();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushBlocks();
      const level = heading[1].length;
      output.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushBlocks();
      output.push('<hr>');
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushBlocks();
      output.push(`<blockquote>${renderInline(quote[1])}</blockquote>`);
      continue;
    }

    const unordered = line.match(/^\s*[-+*]\s+(.+)$/);
    if (unordered) {
      closeParagraph(state, output);
      if (state.listType !== 'ul') {
        closeList(state, output);
        output.push('<ul>');
        state.listType = 'ul';
      }
      output.push(`<li>${renderInline(unordered[1])}</li>`);
      continue;
    }

    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (ordered) {
      closeParagraph(state, output);
      if (state.listType !== 'ol') {
        closeList(state, output);
        output.push('<ol>');
        state.listType = 'ol';
      }
      output.push(`<li>${renderInline(ordered[1])}</li>`);
      continue;
    }

    closeList(state, output);
    state.paragraph.push(line.trim());
  }

  if (inCode) {
    const languageClass = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : '';
    output.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  }

  flushBlocks();
  return output.join('');
}

export function markdownToPlainText(markdown) {
  return String(markdown ?? '')
    .replace(/```[\w-]*\n([\s\S]*?)```/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*[-+*]\s+/gm, '• ')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
