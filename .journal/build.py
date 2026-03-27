#!/usr/bin/env python3
"""
Project Journal Builder — generates index.html from session markdown files.
Designed to evoke Claude Code's web aesthetic: tight spacing, disclosure arrows,
monospace metadata, warm-minimal palette.

Usage:
    python3 .journal/build.py [--open]
"""

import os
import re
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime

JOURNAL_DIR = Path(__file__).parent
SESSIONS_DIR = JOURNAL_DIR / "sessions"
OUTPUT_FILE = JOURNAL_DIR / "index.html"


def parse_frontmatter(content: str) -> tuple[dict, str]:
    """Parse YAML-like frontmatter from markdown."""
    if not content.startswith("---"):
        return {}, content

    end = content.index("---", 3)
    fm_text = content[3:end].strip()
    body = content[end + 3:].strip()

    meta = {}
    for line in fm_text.split("\n"):
        line = line.strip()
        if ":" in line and not line.startswith("-"):
            key, val = line.split(":", 1)
            val = val.strip().strip('"').strip("'")
            if val.startswith("[") and val.endswith("]"):
                val = [v.strip().strip('"').strip("'") for v in val[1:-1].split(",")]
            meta[key.strip()] = val

    return meta, body


def md_to_html(text: str) -> str:
    """Minimal markdown to HTML conversion."""
    lines = text.split("\n")
    html_lines = []
    in_list = False
    in_code = False
    in_table = False

    for line in lines:
        # Code blocks
        if line.strip().startswith("```"):
            if in_code:
                html_lines.append("</code></pre>")
                in_code = False
            else:
                lang = line.strip()[3:]
                html_lines.append(f'<pre><code class="lang-{lang}">')
                in_code = True
            continue
        if in_code:
            html_lines.append(line.replace("<", "&lt;").replace(">", "&gt;"))
            continue

        # Headers
        if line.startswith("### "):
            html_lines.append(f"<h3>{line[4:]}</h3>")
            continue
        if line.startswith("## "):
            html_lines.append(f"<h2>{line[3:]}</h2>")
            continue
        if line.startswith("# "):
            continue  # Skip H1 — we render it from frontmatter

        # Tables
        if "|" in line and line.strip().startswith("|"):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if all(c.startswith("-") for c in cells):
                continue  # Skip separator row
            if not in_table:
                html_lines.append("<table>")
                in_table = True
            html_lines.append("<tr>" + "".join(f"<td>{c}</td>" for c in cells) + "</tr>")
            continue
        elif in_table:
            html_lines.append("</table>")
            in_table = False

        # Lists
        if line.strip().startswith("- [ ] "):
            if not in_list:
                html_lines.append("<ul class='checklist'>")
                in_list = True
            html_lines.append(f"<li class='unchecked'>{line.strip()[6:]}</li>")
            continue
        elif line.strip().startswith("- [x] "):
            if not in_list:
                html_lines.append("<ul class='checklist'>")
                in_list = True
            html_lines.append(f"<li class='checked'>{line.strip()[6:]}</li>")
            continue
        elif line.strip().startswith("- "):
            if not in_list:
                html_lines.append("<ul>")
                in_list = True
            html_lines.append(f"<li>{line.strip()[2:]}</li>")
            continue
        elif re.match(r'^\d+\. ', line.strip()):
            if not in_list:
                html_lines.append("<ol>")
                in_list = True
            html_lines.append(f"<li>{re.sub(r'^\d+\. ', '', line.strip())}</li>")
            continue
        elif in_list and line.strip() == "":
            html_lines.append("</ul>" if "ul" in html_lines[-5:] else "</ol>")
            in_list = False

        # Bold and inline code
        line = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', line)
        line = re.sub(r'`(.+?)`', r'<code class="inline">\1</code>', line)

        # Paragraph
        if line.strip():
            html_lines.append(f"<p>{line}</p>")

    if in_list:
        html_lines.append("</ul>")
    if in_table:
        html_lines.append("</table>")

    return "\n".join(html_lines)


def get_git_info() -> dict:
    """Get current git state."""
    try:
        commit = subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=JOURNAL_DIR.parent, stderr=subprocess.DEVNULL
        ).decode().strip()
        remote = subprocess.check_output(
            ["git", "remote", "get-url", "origin"],
            cwd=JOURNAL_DIR.parent, stderr=subprocess.DEVNULL
        ).decode().strip()
        return {"commit": commit, "remote": remote}
    except Exception:
        return {"commit": "unknown", "remote": ""}


def build():
    sessions = []

    for md_file in sorted(SESSIONS_DIR.glob("*.md"), reverse=True):
        content = md_file.read_text()
        meta, body = parse_frontmatter(content)

        # Extract title from first H1
        title_match = re.search(r'^# (.+)', content, re.MULTILINE)
        title = title_match.group(1) if title_match else md_file.stem

        sessions.append({
            "file": md_file.name,
            "title": title,
            "meta": meta,
            "body_html": md_to_html(body),
        })

    git = get_git_info()
    project_name = JOURNAL_DIR.parent.name

    html = generate_html(project_name, sessions, git)
    OUTPUT_FILE.write_text(html)
    print(f"Built: {OUTPUT_FILE}")
    print(f"  {len(sessions)} session(s)")

    if "--open" in sys.argv:
        subprocess.run(["open", str(OUTPUT_FILE)])


def generate_html(project_name, sessions, git):
    session_cards = ""
    for s in sessions:
        meta = s["meta"]
        date = meta.get("date", "unknown")
        machine = meta.get("machine", "unknown")
        duration = meta.get("duration", "")
        agents = meta.get("agents_used", "")
        tags = meta.get("tags", [])
        if isinstance(tags, str):
            tags = [tags]
        session_id = meta.get("session_id", "")[:8]

        tag_html = "".join(f'<span class="tag">{t}</span>' for t in tags)

        meta_parts = [f'<span class="meta-date">{date}</span>']
        if machine:
            meta_parts.append(f'<span class="meta-machine">{machine}</span>')
        if duration:
            meta_parts.append(f'<span class="meta-duration">{duration}</span>')
        if agents:
            meta_parts.append(f'<span class="meta-agents">{agents} agents</span>')
        if session_id:
            meta_parts.append(f'<span class="meta-session">{session_id}</span>')

        meta_line = ' <span class="meta-sep">/</span> '.join(meta_parts)

        commits_html = ""
        commits = meta.get("commits", [])
        if isinstance(commits, str):
            commits = [commits]
        if commits:
            commit_items = "".join(
                f'<li><code>{c.split(" — ")[0] if " — " in c else c[:7]}</code> {c.split(" — ")[1] if " — " in c else c[8:]}</li>'
                for c in commits if c
            )
            commits_html = f'''
            <details class="commits-detail">
                <summary>Commits ({len(commits)})</summary>
                <ul class="commit-list">{commit_items}</ul>
            </details>'''

        session_cards += f'''
        <details class="session-card" open>
            <summary class="session-header">
                <span class="session-title">{s["title"].replace("Session: ", "")}</span>
                <span class="session-meta">{meta_line}</span>
            </summary>
            <div class="session-body">
                <div class="session-tags">{tag_html}</div>
                {commits_html}
                <div class="session-content">{s["body_html"]}</div>
            </div>
        </details>'''

    remote_url = git.get("remote", "").replace(".git", "")

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{project_name} — Project Journal</title>
<style>
/* === Claude Code Inspired Design System === */
/* Tight spacing, disclosure arrows, monospace meta, warm-minimal palette */

:root {{
    --bg-primary: #1a1a1a;  /* Designer spec: exact Claude Code values */
    --bg-secondary: #212121;
    --bg-tertiary: #2d2d2d;
    --bg-hover: #333333;
    --text-primary: #e8e8e8;
    --text-secondary: #a0a0a0;
    --text-muted: #666666;
    --accent: #da7756;
    --accent-dim: #da775620;
    --border: #333333;
    --border-subtle: #2a2a2a;
    --code-bg: #1e1e1e;
    --green: #4ade80;
    --orange: #fb923c;
    --blue: #60a5fa;
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-mono: 'Söhne Mono', 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
    --content-width: 680px;
    --line-height: 1.45;
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 12px;
    --spacing-lg: 20px;
    --spacing-xl: 32px;
}}

* {{ margin: 0; padding: 0; box-sizing: border-box; }}

body {{
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: var(--line-height);
    color: var(--text-primary);
    background: var(--bg-primary);
    -webkit-font-smoothing: antialiased;
}}

/* === Layout === */
.container {{
    max-width: var(--content-width);
    margin: 0 auto;
    padding: var(--spacing-xl) var(--spacing-lg);
}}

/* === Header === */
.header {{
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-lg);
    border-bottom: 1px solid var(--border);
}}
.header h1 {{
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
}}
.header .subtitle {{
    font-family: var(--font-mono);
    font-size: 11.5px;
    color: var(--text-muted);
    letter-spacing: 0.02em;
}}
.header .subtitle a {{
    color: var(--text-secondary);
    text-decoration: none;
}}
.header .subtitle a:hover {{
    color: var(--accent);
}}
.header-meta {{
    display: flex;
    gap: var(--spacing-md);
    margin-top: var(--spacing-sm);
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-muted);
}}

/* === Session Cards === */
.session-card {{
    margin-bottom: 2px;
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    overflow: hidden;
    background: var(--bg-secondary);
}}
.session-card[open] {{
    border-color: var(--border);
}}
.session-header {{
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: var(--spacing-md) var(--spacing-lg);
    cursor: pointer;
    user-select: none;
    list-style: none;
}}
.session-header::-webkit-details-marker {{ display: none; }}
.session-header::before {{
    content: '\\25B6';
    font-size: 9px;
    color: var(--text-muted);
    position: absolute;
    margin-left: -14px;
    margin-top: 3px;
    transition: transform 0.15s ease;
}}
.session-card[open] > .session-header::before {{
    transform: rotate(90deg);
}}
.session-header {{
    position: relative;
    padding-left: calc(var(--spacing-lg) + 6px);
}}
.session-header:hover {{
    background: var(--bg-hover);
}}
.session-title {{
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    letter-spacing: -0.01em;
}}
.session-meta {{
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.3;
}}
.meta-sep {{ color: var(--border); margin: 0 1px; }}

/* === Session Body === */
.session-body {{
    padding: 0 var(--spacing-lg) var(--spacing-lg) calc(var(--spacing-lg) + 6px);
}}
.session-tags {{
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-md);
}}
.tag {{
    font-family: var(--font-mono);
    font-size: 10.5px;
    padding: 1px 7px;
    border-radius: 3px;
    background: var(--accent-dim);
    color: var(--accent);
    letter-spacing: 0.02em;
}}

/* === Content Styling === */
.session-content h2 {{
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
    margin: var(--spacing-lg) 0 var(--spacing-sm);
    padding-bottom: var(--spacing-xs);
    border-bottom: 1px solid var(--border-subtle);
}}
.session-content h3 {{
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    margin: var(--spacing-md) 0 var(--spacing-xs);
}}
.session-content p {{
    color: var(--text-secondary);
    margin-bottom: var(--spacing-sm);
}}
.session-content ul, .session-content ol {{
    padding-left: 18px;
    margin-bottom: var(--spacing-sm);
    color: var(--text-secondary);
}}
.session-content li {{
    margin-bottom: 2px;
}}
.session-content li::marker {{
    color: var(--text-muted);
}}
.session-content strong {{
    color: var(--text-primary);
    font-weight: 500;
}}
.session-content table {{
    width: 100%;
    border-collapse: collapse;
    margin: var(--spacing-sm) 0;
    font-size: 12.5px;
}}
.session-content td {{
    padding: var(--spacing-xs) var(--spacing-sm);
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text-secondary);
}}
.session-content td:first-child {{
    font-family: var(--font-mono);
    font-size: 11.5px;
    color: var(--text-primary);
    white-space: nowrap;
}}

/* === Inline Code === */
code.inline {{
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 1px 5px;
    border-radius: 3px;
    background: var(--bg-tertiary);
    color: var(--accent);
}}

/* === Code Blocks === */
pre {{
    background: var(--code-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 5px;
    padding: var(--spacing-md);
    margin: var(--spacing-sm) 0;
    overflow-x: auto;
}}
pre code {{
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.5;
    color: var(--text-secondary);
}}

/* === Commits Detail === */
.commits-detail {{
    margin: var(--spacing-sm) 0;
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    overflow: hidden;
}}
.commits-detail summary {{
    font-family: var(--font-mono);
    font-size: 11.5px;
    color: var(--text-muted);
    padding: var(--spacing-xs) var(--spacing-sm);
    cursor: pointer;
    background: var(--bg-tertiary);
    list-style: none;
}}
.commits-detail summary::-webkit-details-marker {{ display: none; }}
.commits-detail summary::before {{
    content: '\\25B6 ';
    font-size: 8px;
    transition: transform 0.15s ease;
    display: inline-block;
}}
.commits-detail[open] summary::before {{
    transform: rotate(90deg);
}}
.commit-list {{
    list-style: none;
    padding: var(--spacing-xs) var(--spacing-sm);
}}
.commit-list li {{
    font-size: 12px;
    color: var(--text-secondary);
    padding: 2px 0;
    font-family: var(--font-sans);
}}
.commit-list code {{
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--orange);
    background: var(--bg-tertiary);
    padding: 0 4px;
    border-radius: 2px;
}}

/* === Checklist === */
.checklist {{ list-style: none; padding-left: 0; }}
.checklist li {{ padding: 2px 0; }}
.checklist li::before {{ margin-right: 6px; }}
.checked::before {{ content: '\\2713'; color: var(--green); }}
.unchecked::before {{ content: '\\25CB'; color: var(--text-muted); }}

/* === Footer === */
.footer {{
    margin-top: var(--spacing-xl);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--border);
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--text-muted);
    display: flex;
    justify-content: space-between;
}}
.footer a {{ color: var(--text-secondary); text-decoration: none; }}
.footer a:hover {{ color: var(--accent); }}

/* === Scrollbar (subtle) === */
::-webkit-scrollbar {{ width: 6px; height: 6px; }}
::-webkit-scrollbar-track {{ background: transparent; }}
::-webkit-scrollbar-thumb {{ background: var(--border); border-radius: 3px; }}
::-webkit-scrollbar-thumb:hover {{ background: var(--bg-hover); }}

/* === Selection === */
::selection {{ background: var(--accent-dim); color: var(--text-primary); }}

/* === Anti-aliasing (mandatory for dark mode) === */
html {{ -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }}
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>{project_name} — Project Journal</h1>
        <div class="subtitle">
            <a href="{remote_url}">{remote_url.replace("https://github.com/", "")}</a>
        </div>
        <div class="header-meta">
            <span>{len(sessions)} session{"s" if len(sessions) != 1 else ""}</span>
            <span>{git["commit"]}</span>
            <span>built {datetime.now().strftime("%Y-%m-%d %H:%M")}</span>
        </div>
    </div>

    {session_cards}

    <div class="footer">
        <span>Project Journal v0.1</span>
        <a href="{remote_url}">GitHub</a>
    </div>
</div>
</body>
</html>'''


if __name__ == "__main__":
    build()
