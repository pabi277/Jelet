import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderTutorBubbleHtml } from '../assets/js/views/ai-tutor.js';

test('tutor renders headings, lists, emphasis and math without raw markdown', () => {
  const text = '# Why this matters\n\n**Correct Answer: (B) 8**\n\n- **Property 1:** $A\\cdot B$\n- **Property 2:** $|kA|=k^n|A|$\n\n$$\nx^2 + 1\n$$\n\n*Remember* the order.';
  const html = renderTutorBubbleHtml(text);
  assert.match(html, /class="ai-msg-heading">Why this matters/);
  assert.match(html, /<strong>Correct Answer: \(B\) 8<\/strong>/);
  assert.equal((html.match(/<li>/g)||[]).length,2);
  assert.match(html, /katex-display/);
  assert.match(html, /<em>Remember<\/em>/);
  assert.ok(!html.includes('# Why this matters'));
  assert.ok(!html.includes('**Correct Answer'));
});

test('tutor escapes untrusted markup and tolerates unfinished streaming math', () => {
  const html = renderTutorBubbleHtml('<img src=x onerror=alert(1)>\n\n$$\nx^2');
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;img'));
  assert.ok(html.includes('x^2'));
  assert.ok(!html.includes('katex-display'));
});
