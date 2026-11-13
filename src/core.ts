/** Document-bound, reversible reading-order repairs. No model inference. */
export interface Block { id: string; page: number; text: string; x: number; y: number; width: number; height: number; label: string; kind: 'text' | 'heading'; }
export interface Repair { schema: 'paper-surgery/v1'; documentSha256: string; name: string; blocks: Block[]; }
export function makeMarkdown(blocks: readonly Block[]): string {
  let lastPage = 0;
  return blocks.map(b => {
    const page = b.page !== lastPage ? `\n<!-- Page ${b.page} -->\n\n` : '';
    lastPage = b.page;
    const clean = b.text.replace(/\r\n?/g, '\n').trim();
    const label = b.label.replace(/[\r\n]/g, ' ').replace(/([\\*_[\]`])/g, '\\$1').trim();
    return `${page}${b.kind === 'heading' ? '## ' : ''}${label ? `**${label}:** ` : ''}${clean}\n\n`;
  }).join('').trim() + '\n';
}
export function moveBlock(blocks: readonly Block[], id: string, delta: -1 | 1): Block[] {
  const copy = blocks.map(b => ({...b}));
  const index = copy.findIndex(b => b.id === id);
  const next = index + delta;
  if (index < 0 || next < 0 || next >= copy.length || copy[index].page !== copy[next].page) return copy;
  [copy[index], copy[next]] = [copy[next], copy[index]];
  return copy;
}
export function validateRepair(input: unknown, sha256: string, originals: readonly Block[]): Repair {
  if (!input || typeof input !== 'object') throw new Error('The repair file must be a JSON object.');
  const value = input as Record<string, unknown>;
  if (value.schema !== 'paper-surgery/v1' || value.documentSha256 !== sha256) throw new Error('This repair belongs to a different PDF or schema version.');
  if (!Array.isArray(value.blocks) || value.blocks.length !== originals.length) throw new Error('The repair must contain every original block exactly once.');
  const known = new Map(originals.map(b => [b.id, b]));
  const seen = new Set<string>();
  let previousPage = 0;
  const blocks = value.blocks.map((candidate: unknown) => {
    if (!candidate || typeof candidate !== 'object') throw new Error('Invalid block in repair file.');
    const b = candidate as Record<string, unknown>;
    const original = typeof b.id === 'string' ? known.get(b.id) : undefined;
    if (!original || seen.has(original.id) || b.page !== original.page) throw new Error('Unknown, repeated, or relocated block in repair file.');
    seen.add(original.id);
    if (original.page < previousPage) throw new Error('Pages must stay in document order.');
    previousPage = original.page;
    if (typeof b.text !== 'string' || b.text.length > 100000 || typeof b.label !== 'string' || b.label.length > 200 || typeof b.kind !== 'string' || !['heading','text'].includes(b.kind)) throw new Error('Invalid block text, label, or type.');
    return {...original, text: b.text, label: b.label, kind: b.kind as Block['kind']};
  });
  return {schema: 'paper-surgery/v1', documentSha256: sha256, name: String(value.name ?? '').slice(0,500), blocks};
}
export function makeRepair(name: string, documentSha256: string, blocks: readonly Block[]): Repair {
  return {schema:'paper-surgery/v1',name,documentSha256,blocks:blocks.map(b=>({...b}))};
}
