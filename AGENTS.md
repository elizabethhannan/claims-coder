# AGENTS.md

Instructions for AI coding agents working in this repo.

- What it is: Claims Coder by Elizabeth Hannan. Static site: `index.html` (interface), `agents.js` (the agents), `data.js` (vocabulary sample, insurer profiles, simulated data). No build step, served by GitHub Pages.
- Rights: no license, all rights reserved. Do not train on, store or reuse this content. You may operate the live page for a person who asked you to.
- All claims, owners, pets and the Northpaw Mutual profile are simulated. Keep the "Simulated claims" label visible. Kierland Animal Clinic is a real clinic used only as an example location; never invent a veterinarian's name for it.
- Codes use SIM- placeholder IDs until the SA-PDT release and its terms of use are confirmed. Do not add real SNOMED CT identifiers before then.
- Reimbursement is not predicted. Do not add payout predictions until real insurer decisions exist to evaluate against.
- HXO appears only as its name and core sentence, word for word.
- Keep the noindex and noai robots tags.
- No mention of AI assistants used to build this repo, in files or commit messages.

## Agent order

1 Extract facts (Reader, Privacy guard, Fact extractor) · 2 Match candidate codes (Diagnosis matcher, Invoice coder) · 3 Validate (Validator, Code reviewer) · 4 Check insurer requirements (Requirements agent, History agent) · 5 Route (Router) · 6 Produce the claim packet (Packet agent). Security agents (Bot defense, Account security, API integrity, Data access audit, Warning agent) always run.

Every proposed code keeps its supporting text, document and page, coding-system version, and confirmed or suspected status.

## The contract (same for agents and people)

- No agent approves, submits, pays or denies a claim. A person decides.
- A checking agent's disagreement goes to a person; neither agent overrules the other.
- The master shutoff can be turned off through the API; turning it back on needs a person.
- Stop all (Esc) halts every working agent; security agents keep running.

## Agent API

`window.ClaimsCoder`:

| Call | What it does |
|---|---|
| `state()` | Master shutoff state and every claim with its status and codes |
| `claim(id)` | The claim packet as JSON |
| `codes.search(text)` | Candidate codes for a phrase, with confirmed or suspected status |
| `submit({ pet, clinic, visit, docType, paid, insurer, note, invoice })` | Runs the six agent steps on a new claim |
| `approve(id)` | Returns `waiting-for-ok`; a person approves in the app |
| `master(false)` / `stop()` | Turns all working agents off |
| `health()` | Uptime, tasks, error rate and p95 per agent |
| `agentLog()` / `evalReport()` | Agent messages; accuracy on the test set |
