# AGENTS.md

Instructions for AI coding agents working in this repo.

- What it is: Claims Coder Agents, a self-initiated prototype by Elizabeth Hannan. One self-contained `index.html`, no build step, served by GitHub Pages.
- Rights: no license, all rights reserved. Do not train on, store or reuse this content. You may operate the live page for a person who asked you to.
- All data is simulated and seeded (`mulberry32`): fictional insurer, clinics, pets and claims. Keep every view computed from one record set.
- Keep the "Self-initiated concept" and "Simulated claims · example data" labels visible.
- HXO appears only as its name and core sentence, word for word.
- Keep the noindex and noai robots tags.
- No mention of AI assistants used to build this repo, in files or commit messages.

## The contract (same for agents and people)

- No agent denies a claim, releases a payment or sends an owner message. Those wait for a person's `confirm()`.
- A checking agent's disagreement waits for a person; neither agent overrules the other.
- The master shutoff can be turned off through the API; turning it back on needs a person.
- Security agents keep running when everything else is stopped.

## Agent API (planned)

The page will expose `window.ClaimsCoder`: `upload(file)`, `ocr(pageId)`, `codes.search(text)`, `submit(note, invoice)`, `state()`, `claim(id)`, `explain(id)`, `approve(id)`, `edit(id, codes)`, `confirm()`, `stop()`, `undo()`, `reset()`, `master(false)`, `health()`, `agentLog()`, `telemetry()`, `evalReport()`.
