# How to add blog + white paper pages

**Inspiration = project hubs** (`work/*.html`), not the old deleted posts.

Same stall.one shell. Same language: kicker → title → lede → meta → tags → `//` sections → callout → actions.

## The project tree

```
work/taxfort.html          ← hub (case study + deliverable links)
blog/Taxbox/
  Architecture.html        ← white paper (linked from hub card 02)
  field-notes.html         ← blog log (linked from hub technical logs)
```

## Recipe (copy from a hub)

1. Open a hub, e.g. `work/taxfort.html`
2. Steal structure:
   - header / footer (unchanged)
   - `case-study-kicker`, `h1`, `case-study-lede`
   - `case-study-meta`, `tags`
   - `h2` sections (Problem / Approach style)
   - `case-callout`
   - `case-actions` nav
3. For **white paper**: deeper system sections + optional ASCII diagram  
4. For **blog**: shorter field-note sections (Context / Tried / Takeaway)

## Commands

```bash
mkdir -p blog/Taxbox

# blank templates (placeholders)
cp starters/blog.html blog/Taxbox/my-note.html
cp starters/white-paper.html blog/Taxbox/Architecture.html

# or use the filled Taxbox examples already in the repo:
#   blog/Taxbox/Architecture.html
#   blog/Taxbox/field-notes.html
```

## Wire the hub

In `work/{{slug}}.html` deliverable cards:

```html
href="../blog/Taxbox/Architecture.html"   <!-- white paper -->
href="../blog/Taxbox/field-notes.html"    <!-- log -->
```

In **Technical logs**:

```html
<a href="../blog/Taxbox/field-notes.html" …><span>LOG</span>Field notes</a>
```

## What not to do

- Don’t invent a second visual system for posts — use `style.css` case-study classes.
- Don’t restyle the header for a project — product vibe stays inside `.project-vibe` on the hub only.
