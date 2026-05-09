# Inspiration: 3 Systems to Unlock Claude Code Design Power

## Source

- URL: https://www.tiktok.com/@jensheitmann_/video/7613073206722727198
- Platform: tiktok
- Download Status: ok
- Captured: 2026-03-05 03:07 GMT
- Creator: Jens Heitmann
- Duration: 0:57
- Also available: https://www.instagram.com/reel/DVbfcdTkZ7R

## Transcript

You probably have an unlocked the full design power of your cloud code and I'm not just talking about the front end skill.
Here are three systems you need to install into your cloud code right now to really take your web and app design to the next level.
First you need to install Google's stitch MCP and nano banana 2 to make really powerful mockups for cloud code to use as reference.
Next you need to get this Pro UX UI design skill from this GitHub library here.
And to tie it all together you need to use an asset library like 21st.dev that holds a ton of beautiful 3D and reactive components for you to use in your apps or websites.
Now using all three together we'll take your designs looking from something like this into looking something like this this or this.
When it comes to designing with AI we as the humans are the ones that set the standard of the quality using these three systems will raise the floor of all of your future project.

## Timestamps

- (none -- TikTok short, no chapter markers)

## Extracted Entities

### Tools

- Google Stitch MCP -- AI design-to-code platform from Google Labs. Generates UI screens from text prompts, extracts "Design DNA" (fonts, colours, layouts), proxies design context to coding agents.
- Nano Banana 2 -- AI image generation skill/MCP powered by Gemini. Creates mockups, reference images, and style transfers for Claude Code to use as design references.
- UI/UX Pro Max -- Claude Code skill providing design intelligence. 50 UI styles, 21 palettes, 50 font pairings, 20 chart types, 9 framework stacks. Searchable design database.
- 21st.dev -- Component library with 3D and reactive components. Integrates via Magic MCP server.
- Claude Code -- the host environment for all three systems.

### Domains

- 21st.dev -- reactive component library
- stitch.withgoogle.com -- Google Stitch design platform

### Repo Candidates

- https://github.com/davideast/stitch-mcp -- official Stitch MCP CLI
- https://github.com/kingbootoshi/nano-banana-2-skill -- Nano Banana 2 skill for Claude Code
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill -- UI/UX Pro Max skill

### Keywords

- design systems, MCP, mockups, UI components, AI design, Claude Code skills, image generation, style transfer, design intelligence, reactive components

## Resolved Links

- Google Stitch MCP: https://github.com/davideast/stitch-mcp
- Google Stitch docs: https://stitch.withgoogle.com/docs/mcp/setup
- Nano Banana 2 skill: https://github.com/kingbootoshi/nano-banana-2-skill
- Nano Banana MCP (ConechoAI): https://github.com/ConechoAI/Nano-Banana-MCP
- UI/UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- 21st.dev Magic MCP: already configured in .mcp.json

## Build Spec Draft

**3-System Design Stack for Claude Code**

This is exactly the pipeline described in the UI Build Pipeline (Workflow A). The video validates the architecture we already planned:

1. **Stitch MCP** (structure) -- `npx @_davideast/stitch-mcp proxy` -- needs GCP auth
2. **Nano Banana 2** (mockups/references) -- skill or MCP, needs Gemini API key
3. **UI/UX Pro Max** (design system) -- `npm install -g uipro-cli && uipro init --ai claude`
4. **21st.dev** (components) -- already configured and tested

Action: This capture record confirms the Workflow A pipeline is the right architecture. Next steps are installing the remaining 3 tools.
