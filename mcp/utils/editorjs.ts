import readingTime from 'reading-time';

export interface EditorJsContent {
  blocks: Array<{ type: string; data: Record<string, unknown> }>;
  time?: number;
  version?: string;
}

export function parseEditorJsContent(raw: string): EditorJsContent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('content is not valid JSON');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray((parsed as Record<string, unknown>).blocks)
  ) {
    throw new Error('content must be an Editor.js JSON object with a top-level "blocks" array');
  }

  return parsed as EditorJsContent;
}

function extractText(block: { type: string; data: Record<string, unknown> }): string {
  const d = block.data;
  switch (block.type) {
    case 'header':
    case 'paragraph':
      return String(d.text ?? '');
    case 'list': {
      const items = Array.isArray(d.items) ? d.items : [];
      return items
        .map((i) => (typeof i === 'string' ? i : String((i as Record<string, unknown>).content ?? '')))
        .join(' ');
    }
    case 'code':
      return String(d.code ?? '');
    case 'quote':
      return `${d.text ?? ''} ${d.caption ?? ''}`;
    case 'callout':
      return String(d.text ?? '');
    default:
      return '';
  }
}

export function computeEditorJsReadingTime(content: EditorJsContent): number {
  const text = content.blocks.map(extractText).join(' ');
  if (!text.trim()) return 1;
  return Math.max(1, Math.round(readingTime(text).minutes));
}
