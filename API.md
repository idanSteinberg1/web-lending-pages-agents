# Using the site factory through the Claude API

For when the agent becomes a product: your server sends a brief and gets back a landing page **in structured parts** (meta, tokens, sections, CSS, JS, TODOs), which it stores, lets users edit per section, and assembles into HTML.

## Model
Use a current model; check https://docs.claude.com for the latest IDs. At the time of writing: `claude-sonnet-5` (fast, strong at code and design) or `claude-opus-5-5` (hardest briefs). Claude 3.5 Sonnet is outdated.

## Getting guaranteed JSON: force a tool call
The most portable way to get output that matches a schema is to define one tool whose `input_schema` is the schema and force the model to call it. (The API also has a native structured-outputs option; check the docs for its current parameter name.)

```js
// generate.mjs  ->  node generate.mjs brief.txt out.html
import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs';

const [briefPath, outPath = 'out.html'] = process.argv.slice(2);
const client = new Anthropic(); // ANTHROPIC_API_KEY from env
const schema = JSON.parse(fs.readFileSync('templates/site-output.schema.json', 'utf8'));

// System prompt = the factory rules + the skills the model needs, concatenated.
const system = [
  'CLAUDE.site-factory.md',
  '.claude/skills/art-direction/SKILL.md',
  '.claude/skills/conversion-sections/SKILL.md',
  '.claude/skills/ui-components/SKILL.md',
  '.claude/skills/micro-interactions/SKILL.md',
].map((f) => fs.readFileSync(f, 'utf8')).join('\n\n---\n\n');

const stream = client.messages.stream({
  model: 'claude-sonnet-5',
  max_tokens: 32000,
  system,
  tools: [{ name: 'emit_site', description: 'Return the complete landing page in parts.', input_schema: schema }],
  tool_choice: { type: 'tool', name: 'emit_site' },
  messages: [{
    role: 'user',
    content: `Build a complete landing page for this brief. Choose one strong direction.\n\n<brief>\n${fs.readFileSync(briefPath, 'utf8')}\n</brief>`,
  }],
});
const msg = await stream.finalMessage(); // streaming avoids timeouts on long outputs
const site = msg.content.find((b) => b.type === 'tool_use').input;

const html = `<!doctype html>
<html lang="${site.meta.lang}" dir="${site.meta.dir}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${site.meta.title}</title>
<meta name="description" content="${site.meta.description}">
${site.meta.fontsHref ? `<link rel="stylesheet" href="${site.meta.fontsHref}">` : ''}
<style>${site.tokensCss}\n${site.css}</style>
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
${site.sections.map((s) => `<!-- ${s.id}: ${s.job} -->\n${s.html}`).join('\n')}
<script type="module">${site.js}</script>
</body>
</html>`;
fs.writeFileSync(outPath, html);
fs.writeFileSync(outPath.replace(/\.html$/, '.json'), JSON.stringify(site, null, 2));
console.log(`Wrote ${outPath}. TODOs:\n- ${site.todos.join('\n- ')}`);
```

Install: `npm i @anthropic-ai/sdk`.

## Making it studio-grade over the API
One call gives a decent page. For the quality of `/new-site`, chain calls the same way the agents do:
1. brief → `brief.json` (spec-intake rules)
2. brief → 3 directions (art-direction) → user picks
3. brief + direction → copy (conversion-sections)
4. copy + direction → `emit_site`
5. render with Playwright, send screenshots back as images with the critic rubric → fixes → re-emit only the sections that changed

Because sections come back separately, step 5 and user edits ("make the hero bolder") regenerate one section, not the whole page.

## Production notes
- Sanitize model-generated HTML before serving it to other users' visitors, or serve generated sites from an isolated domain.
- Escape `meta` values when templating (the example above doesn't, for brevity).
- Log the brief, the direction and the output JSON per generation, so you can compare and improve prompts.
