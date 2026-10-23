/* Claims Coder agents. Rule-based agents that run in the browser, in this order:
   1 Extract facts  2 Match candidate codes  3 Validate  4 Check insurer requirements  5 Route  6 Produce the claim packet.
   Every proposed code keeps its supporting text, document and page, coding-system version, and confirmed or suspected status. */
(function () {
  "use strict";
  const D = window.CC_DATA;

  const UNCERTAIN = /\b(r\/o|rule[- ]?out|ruled out|suspect(?:ed)?|possible|possibly|probable|presumptive|differential|ddx|vs\.?|versus|pending|cannot rule out|likely|query|\?)/i;
  const SECTION_RE = /(^|\n|\s)(S|O|A|P|Subjective|Objective|Assessment|Plan)\s*:/g;
  const SYSTEM_WORDS = {
    Ear: ["ear", "otic", "aural", "head shak"], Skin: ["skin", "itch", "scratch", "derm", "lesion", "rash"],
    Digestive: ["vomit", "diarrh", "stool", "gastro", "appetite"], Dental: ["tooth", "teeth", "dental", "gum", "breath"],
    Urinary: ["urin", "bladder", "litter", "straining", "pee"], Endocrine: ["thyroid", "glucose", "thirst", "drinking more"],
    Musculoskeletal: ["lame", "limp", "joint", "stifle", "hip", "knee"], Injury: ["wound", "cut", "bite", "bleed"],
    Eye: ["eye", "squint", "ocular"], Respiratory: ["cough", "sneez", "breath", "nasal"], Cardiovascular: ["murmur", "heart"],
    Neurologic: ["seizure", "spine", "spinal", "back pain", "wobbl"], Cancer: ["mass", "lump", "tumor"],
  };

  const norm = (s) => (" " + s.toLowerCase().replace(/[^a-z0-9/ ]+/g, " ").replace(/\s+/g, " ") + " ");
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const days = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
  const addDays = (d, n) => { const x = new Date(d + "T12:00:00"); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
  const addMonths = (d, n) => { const x = new Date(d + "T12:00:00"); x.setMonth(x.getMonth() + n); return x.toISOString().slice(0, 10); };
  function lev(a, b) { const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9; const d = Array.from({ length: m + 1 }, (_, i) => [i]); for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }

  // ---------- 1 Extract facts ----------
  function redact(text) {
    let n = 0;
    const out = text
      .replace(/\b\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b/g, () => { n++; return "[phone redacted]"; })
      .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, () => { n++; return "[email redacted]"; })
      .replace(/\b\d{2,5} [A-Z][a-z]+ (St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Way)\b\.?/g, () => { n++; return "[address redacted]"; })
      .replace(/\b(?:\d[ -]?){13,16}\b/g, () => { n++; return "[card redacted]"; })
      .replace(/^(Owner|Client)\s*:.*$/gim, (m, k) => { n++; return k + ": [redacted]"; });
    return { text: out, count: n };
  }

  function sections(text) {
    const marks = []; let m; SECTION_RE.lastIndex = 0;
    while ((m = SECTION_RE.exec(text))) marks.push({ key: m[2][0].toUpperCase(), start: m.index + m[1].length, body: m.index + m[0].length });
    const out = { S: "", O: "", A: "", P: "", header: text.slice(0, marks.length ? marks[0].start : text.length).trim() };
    marks.forEach((k, i) => { out[k.key] += (out[k.key] ? " " : "") + text.slice(k.body, i + 1 < marks.length ? marks[i + 1].start : text.length).trim(); });
    if (!marks.length) out.A = text.trim();
    return out;
  }

  function headerFacts(text) {
    const g = (re) => { const m = text.match(re); return m ? m[1].trim() : null; };
    let date = g(/date of (?:visit|service)\s*:\s*([0-9/.-]+)/i);
    if (date && /\//.test(date)) { const [mm, dd, yy] = date.split("/"); date = `${yy.length === 2 ? "20" + yy : yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`; }
    return { patient: g(/patient\s*:\s*([^,\n]+)/i), clinic: g(/clinic\s*:\s*([^\n]+)/i), visitDate: date, signed: g(/(?:signed|veterinarian|dvm)\s*:\s*([^\n]+)/i) };
  }

  function assessmentItems(A, fullText, page) {
    const parts = A.split(/(?:^|\s)\d+\.\s+|[.;]\s+|\n/).map((s) => s.trim().replace(/\.$/, "")).filter((s) => s.length > 1);
    return parts.map((t) => ({ text: t, status: UNCERTAIN.test(t) ? "suspected" : "confirmed", page: page || 1 }));
  }

  function parseInvoice(text) {
    const lines = [], warnings = []; let total = null;
    for (const raw of (text || "").split(/\n/)) {
      const l = raw.trim(); if (!l) continue;
      const t = l.match(/^(?:grand\s+)?total\s*:?\s*\$?\s*([\d,]+\.\d{2})$/i);
      if (t) { total = +t[1].replace(/,/g, ""); continue; }
      const m = l.match(/^(.+?)\s+(\d{1,3})\s+\$?\s*([\d,]+\.\d{2})$/) || l.match(/^(.+?)\s+\$?\s*([\d,]+\.\d{2})$/);
      if (m) { const qty = m.length === 4 ? +m[2] : 1; const amt = +(m.length === 4 ? m[3] : m[2]).replace(/,/g, ""); lines.push({ desc: m[1].replace(/[,:]$/, "").trim(), qty, amount: amt }); }
      else warnings.push(l);
    }
    const sum = Math.round(lines.reduce((a, b) => a + b.amount, 0) * 100) / 100;
    return { lines, total: total === null ? sum : total, sum, reconciles: total === null || Math.abs(total - sum) < 0.005, unread: warnings };
  }

  // ---------- 2 Match candidate codes ----------
  function matchItem(item, species) {
    const t = norm(item.text), hits = [];
    for (const v of D.VOCAB) {
      let best = null;
      for (const [phrase, score] of [[v.term, 0.95], ...v.syn.map((s) => [s, 0.88])]) {
        const p = norm(phrase).trim(); const re = new RegExp("(^| )" + esc(p) + "( |$)"); const mm = re.exec(t);
        if (!mm) continue;
        const span = [mm.index, mm.index + p.length + 1];
        if (!best || span[1] - span[0] > best.span[1] - best.span[0]) best = { v, score: best ? Math.max(best.score, score) : score, span, via: phrase };
        else best.score = Math.max(best.score, score);
      }
      if (best) hits.push(best);
    }
    // Longest match wins where one matched phrase sits inside another (e.g. "cat bite abscess" over "cat bite").
    let kept = hits.filter((h) => !hits.some((o) => o !== h && o.v.id !== h.v.id && o.span[0] <= h.span[0] && o.span[1] >= h.span[1] && (o.span[1] - o.span[0]) > (h.span[1] - h.span[0])));
    if (!kept.length) {
      const words = t.trim().split(" ").filter((w) => w.length > 3);
      const fuzzy = [];
      for (const v of D.VOCAB) {
        const tw = v.term.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
        const found = tw.filter((w) => words.some((x) => x.slice(0, 5) === w.slice(0, 5) || (w.length >= 6 && lev(x, w) <= 1))).length;
        const frac = tw.length ? found / tw.length : 0;
        if (frac >= 0.67) fuzzy.push({ v, score: Math.round((0.55 + 0.2 * frac) * 100) / 100, via: "close spelling", span: [0, 0] });
      }
      kept = fuzzy.sort((a, b) => b.score - a.score).slice(0, 1);
    }
    return kept.map((h) => {
      let score = h.score; const notes = [];
      if (h.v.species && species && !h.v.species.includes(species)) { score -= 0.3; notes.push("usually seen in " + h.v.species.join(" and ")); }
      return { id: h.v.id, term: h.v.term, system: h.v.system, def: h.v.def, score: Math.max(0.05, Math.round(score * 100) / 100), via: h.via, notes };
    });
  }

  function alternatives(text, excludeId) {
    const t = norm(text).trim().split(" ").filter((w) => w.length > 3);
    return D.VOCAB.filter((v) => v.id !== excludeId).map((v) => {
      const bag = norm(v.term + " " + v.syn.join(" ") + " " + v.system).trim().split(" ");
      const s = t.filter((w) => bag.some((b) => b.slice(0, 5) === w.slice(0, 5))).length; return { v, s };
    }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 2).map((x) => ({ id: x.v.id, term: x.v.term }));
  }

  const CATS = [
    ["Exam", /exam|consult|office visit|recheck/i], ["Diagnostics", /cytolog|radiograph|x-?ray|ultrasound|urinalysis|culture|cbc|chemistry|panel|test|fecal|blood ?work|biopsy|aspirate|t4|echo/i],
    ["Surgery", /surg|extraction|tplo|repair|suture|anesthe|sedation|spay|neuter|removal/i], ["Hospitalization", /hospital|overnight|iv fluid|icu|monitoring/i],
    ["Dental cleaning", /dental cleaning|polish|prophy/i], ["Wellness", /vaccin|wellness|heartworm prevent|flea prevent|microchip/i],
    ["Medication", /tablet|capsule|ointment|drops|injection|medication|mg\b|antibiotic|carprofen|gabapentin|maropitant|buprenorphine|amoxicillin|cerenia|pain/i],
    ["Treatment", /cleaning|flush|bandage|laser|fluids|subcutaneous|e-?collar|cone/i], ["Food and supplies", /diet|food|can|bag|supply/i],
  ];
  const LINE_SYSTEM = [["Ear", /ear|otic/i], ["Dental", /dental|tooth|extraction/i], ["Urinary", /urin|bladder|culture/i], ["Injury", /wound|suture|laceration|e-?collar/i],
    ["Musculoskeletal", /stifle|tplo|radiograph|carprofen|joint/i], ["Digestive", /fluids|maropitant|diet/i], ["Neurologic", /gabapentin|spinal/i]];

  function codeInvoice(inv, codes) {
    return inv.lines.map((l) => {
      const cat = (CATS.find(([, re]) => re.test(l.desc)) || ["Other"])[0];
      const sys = (LINE_SYSTEM.find(([, re]) => re.test(l.desc)) || [null])[0];
      const confirmed = codes.filter((c) => c.status === "confirmed");
      const link = cat === "Exam" ? confirmed.map((c) => c.id) : confirmed.filter((c) => c.system === sys || (sys === "Ear" && c.system === "Skin" && /malassezia/i.test(c.term))).map((c) => c.id);
      const note = cat === "Wellness" ? "Often outside accident and illness cover; insurer decides" : cat === "Dental cleaning" ? "Routine cleaning is often excluded; insurer decides" : cat === "Food and supplies" ? "Non-medical item; insurer decides" : null;
      return Object.assign({}, l, { category: cat, treats: link.length ? link : confirmed.map((c) => c.id), note });
    });
  }

  // ---------- 3 Validate ----------
  function validate(code, sec, full, species) {
    const v = D.VOCAB.find((x) => x.id === code.id);
    const hay = (sec.O + " " + sec.A + " " + sec.S).toLowerCase();
    const found = v.needs.filter((k) => hay.includes(k));
    const supported = found.length > 0;
    const out = { supported, found, reason: supported ? "Note mentions " + found.slice(0, 3).join(", ") + ", consistent with the definition." : "No finding in the note matches the definition (" + v.needs.slice(0, 3).join(", ") + ")." };
    if (code.notes.length) out.reason += " Species check: " + code.notes.join("; ") + ".";
    return out;
  }

  function review(code, item, full) {
    // Second agent: re-reads the whole sentence the code came from and the full note, independently of the coder.
    const sentence = full.split(/(?<=[.!?\n])\s+/).find((s) => s.toLowerCase().includes(item.text.toLowerCase().slice(0, 18))) || item.text;
    const unsure = UNCERTAIN.test(sentence);
    if (code.status === "confirmed" && unsure) return { agree: false, says: "Suspected, not confirmed", why: 'The sentence says "' + sentence.trim().slice(0, 90) + '".' };
    if (code.via === "close spelling") return { agree: false, says: "Check the term", why: "Matched on close spelling only, not an exact term or synonym." };
    return { agree: true, says: "Agrees", why: "Same term in the note; status matches the wording." };
  }

  // ---------- 4 Check insurer requirements (and pre-existing time frame) ----------
  function history(pet, codes, visit, ins) {
    if (!pet) return { flags: [], waitEnd: null };
    const waitEnd = addDays(pet.coverageStart, ins.waitingDays);
    const lookStart = ins.lookbackMonths ? addMonths(pet.coverageStart, -ins.lookbackMonths) : null;
    const flags = [];
    if (visit && visit < waitEnd) flags.push({ type: "waiting", text: "Visit on " + visit + " falls inside the " + ins.waitingDays + "-day waiting period (ends " + waitEnd + ")." });
    for (const c of codes.filter((x) => x.status === "confirmed")) {
      const v = D.VOCAB.find((x) => x.id === c.id);
      const words = [...(SYSTEM_WORDS[v.system] || []), v.term.toLowerCase(), ...v.syn];
      for (const h of pet.history) {
        if (!words.some((w) => h.text.toLowerCase().includes(w))) continue;
        const before = h.date < waitEnd; const inWindow = lookStart ? h.date >= lookStart : true;
        if (!(before && inWindow)) continue;
        const gap = visit ? days(h.date, visit) : null;
        const cured = v.curable && gap !== null && gap >= ins.curableFreeDays;
        const same = flags.find((f) => f.type === "preexisting" && f.date === h.date);
        if (same) { same.codes.push(c.id); continue; }
        flags.push({ codes: [c.id], type: "preexisting", code: c.id, date: h.date, text: 'Prior visit ' + h.date + ': "' + h.text.slice(0, 70) + '"', gap, cured,
          detail: cured ? "Possibly covered as a cured recurrence if the pet was free of signs and treatment for " + ins.curableFreeDays + " days; records needed to show it." : "Signs appeared before coverage started; a person decides." });
      }
    }
    return { flags, waitEnd, lookStart };
  }

  function requirements(ins, claim, codes, inv, facts) {
    const has = {
      claimForm: !!(facts.patient && (facts.visitDate || claim.visit) && (facts.clinic || claim.clinicName) && codes.length),
      soapNote: !!claim.noteText && claim.noteText.length > 40,
      itemizedInvoice: inv.lines.length > 0,
      codes: inv.lines.length > 0 && codes.some((c) => c.status === "confirmed"),
      history: true,
    };
    const items = [...ins.required.map(([k, l]) => ({ key: k, label: l, required: true, ok: has[k] })), ...ins.recommended.map(([k, l]) => ({ key: k, label: l, required: false, ok: has[k] }))];
    if (!inv.reconciles) items.push({ key: "totals", label: "Invoice lines add up to the total ($" + inv.sum.toFixed(2) + " vs $" + inv.total.toFixed(2) + ")", required: true, ok: false });
    if (ins.fastTrack && inv.total >= ins.fastTrack.min) items.push({ key: "fast", label: ins.fastTrack.label, required: false, ok: true, info: true });
    if (claim.docType === "estimate") items.push({ key: "estimate", label: "This is an estimate: the claim is filed after treatment with the final invoice", required: false, ok: true, info: true });
    return items;
  }

  // ---------- 5 Route ----------
  function route(codes, reqs, hist, inv) {
    const r = [];
    const confirmed = codes.filter((c) => c.status === "confirmed");
    if (!confirmed.length) r.push("No confirmed diagnosis: only suspected findings (" + (codes.map((c) => c.term).join(", ") || "none") + ").");
    for (const c of confirmed) {
      if (c.score < 0.8) r.push(c.term + ": low match confidence (" + Math.round(c.score * 100) + "%).");
      if (!c.validation.supported) r.push(c.term + ": weak support in the note.");
      if (!c.review.agree) r.push(c.term + ": code reviewer disagrees (" + c.review.says.toLowerCase() + ").");
    }
    for (const f of hist.flags) r.push(f.type === "waiting" ? f.text : "Possible pre-existing condition: " + f.text + ".");
    for (const q of reqs.filter((x) => x.required && !x.ok)) r.push("Missing: " + q.label + ".");
    if (inv.unread.length) r.push(inv.unread.length + " invoice line(s) could not be read.");
    return { toPerson: r.length > 0, reasons: r };
  }

  // ---------- 6 Produce the claim packet ----------
  function packet(claim, facts, codes, invCoded, inv, reqs, hist, routing, ins, steps) {
    return {
      claimId: claim.id, insurerProfile: ins.name, generatedBy: "Claims Coder agents", codingSystem: D.VOCAB_VERSION,
      claimForm: { pet: facts.patient, visitDate: facts.visitDate || claim.visit, clinic: facts.clinic || claim.clinicName, reason: codes.filter((c) => c.status === "confirmed").map((c) => c.term).join("; ") || "See medical record" },
      documents: [{ type: "SOAP note", file: claim.noteFile, pages: claim.notePages }, { type: claim.docType === "estimate" ? "Estimate" : "Itemized invoice" + (claim.paid ? " (paid)" : ""), file: claim.invoiceFile, pages: claim.invoicePages }],
      diagnosisCodes: codes.map((c) => ({ id: c.id, term: c.term, status: c.status, supportingText: c.evidence.text, document: c.evidence.doc, page: c.evidence.page, section: c.evidence.section, codingSystem: D.VOCAB_VERSION, confidence: c.score, validation: c.validation.reason, reviewer: c.review.says })),
      invoiceLines: invCoded.map((l) => ({ description: l.desc, qty: l.qty, amount: l.amount, category: l.category, treats: l.treats })),
      invoiceTotal: inv.total, requirements: reqs.map((q) => ({ item: q.label, required: q.required, met: q.ok })),
      preexistingCheck: hist.flags, routing, auditTrail: steps.map((s) => ({ step: s.n + " " + s.name, agents: s.agents, at: s.at, ms: s.ms, result: s.result })),
      reimbursement: "Not predicted in this version. Decided by the insurer.",
    };
  }

  // ---------- Pipeline ----------
  function run(input) {
    const t0 = input.startedAt ? new Date(input.startedAt).getTime() : Date.now();
    const ins = D.INSURERS[input.insurer || "northpaw"];
    const pet = input.pet || null; const species = pet ? pet.species : null;
    const steps = []; let clock = t0;
    const sim = input.simulatedDurations;
    const step = (n, name, agents, fn, simMs) => { const a = performance.now(); const result = fn(); const real = performance.now() - a; const ms = sim ? simMs : Math.max(1, Math.round(real + (input.extraMs && input.extraMs[n] || 0)));
      clock += ms; steps.push({ n, name, agents, ms, at: new Date(clock).toISOString(), result }); return result; };

    let facts, sec, red, items;
    step(1, "Extract facts", ["Reader", "Privacy guard", "Fact extractor"], () => {
      red = redact(input.note || ""); sec = sections(red.text); facts = headerFacts(red.text);
      items = assessmentItems(sec.A, red.text, 1);
      return red.count + " redacted · " + items.length + " assessment item" + (items.length === 1 ? "" : "s") + " · " + Object.keys(sec).filter((k) => k.length === 1 && sec[k]).join("/") + " found";
    }, 400 + (input.note || "").length * 2);

    let codes = [];
    const inv = parseInvoice(input.invoice); let invCoded = [];
    step(2, "Match candidate codes", ["Diagnosis matcher", "Invoice coder"], () => {
      const byId = {};
      for (const it of items) for (const m of matchItem(it, species)) {
        const c = Object.assign(m, { status: it.status, evidence: { text: it.text, doc: input.noteFile || "SOAP note", page: it.page, section: "Assessment" } });
        if (!byId[c.id] || (byId[c.id].status === "suspected" && c.status === "confirmed")) byId[c.id] = c;
      }
      codes = Object.values(byId);
      invCoded = codeInvoice(inv, codes);
      return codes.filter((c) => c.status === "confirmed").length + " confirmed, " + codes.filter((c) => c.status === "suspected").length + " suspected · " + inv.lines.length + " invoice lines";
    }, 600);

    step(3, "Validate codes", ["Validator", "Code reviewer"], () => {
      for (const c of codes) { c.validation = validate(c, sec, red.text, species); c.review = review(c, { text: c.evidence.text }, red.text); c.alternatives = alternatives(c.evidence.text, c.id); }
      return codes.filter((c) => c.review.agree).length + " of " + codes.length + " agreed";
    }, 400);

    let reqs, hist;
    step(4, "Check insurer requirements", ["Requirements agent", "History agent"], () => {
      hist = history(pet, codes, facts.visitDate || input.visit, ins);
      reqs = requirements(ins, { noteText: input.note, docType: input.docType, visit: input.visit, clinicName: input.clinicName }, codes, inv, facts);
      return reqs.filter((q) => q.required && q.ok).length + " of " + reqs.filter((q) => q.required).length + " required items · " + hist.flags.length + " history flag" + (hist.flags.length === 1 ? "" : "s");
    }, 300);

    let routing;
    step(5, "Route", ["Router"], () => { routing = route(codes, reqs, hist, inv); return routing.toPerson ? "Handed to a person: " + routing.reasons.length + " reason" + (routing.reasons.length === 1 ? "" : "s") : "Ready: no open questions"; }, 100);

    let pk;
    step(6, "Produce claim packet", ["Packet agent"], () => { pk = packet({ id: input.claimId, visit: input.visit, clinicName: input.clinicName, docType: input.docType, paid: input.paid, noteFile: input.noteFile, invoiceFile: input.invoiceFile, notePages: input.notePages || 1, invoicePages: input.invoicePages || 1 }, facts, codes, invCoded, inv, reqs, hist, routing, ins, steps.slice()); return "Packet with " + codes.length + " codes and an evidence trail"; }, 200);
    pk.auditTrail = steps.map((s) => ({ step: s.n + " " + s.name, agents: s.agents, at: s.at, ms: s.ms, result: s.result }));

    return { facts, sections: sec, redactions: red.count, codes, invoice: inv, invoiceCoded: invCoded, requirements: reqs, history: hist, routing, packet: pk, steps, insurer: ins, totalMs: steps.reduce((a, s) => a + s.ms, 0) };
  }

  function evaluate() {
    let tp = 0, fp = 0, fn = 0, exact = 0; const misses = [];
    for (const [note, expect] of D.GOLD) {
      const r = run({ note, invoice: "", insurer: "northpaw" });
      const got = r.codes.filter((c) => c.status === "confirmed").map((c) => c.id);
      const e = new Set(expect), g = new Set(got);
      const t = [...g].filter((x) => e.has(x)).length; tp += t; fp += g.size - t; fn += e.size - t;
      if (g.size === e.size && t === e.size) exact++; else misses.push({ note, expected: expect, got });
    }
    const p = tp / Math.max(1, tp + fp), r = tp / Math.max(1, tp + fn);
    return { n: D.GOLD.length, precision: p, recall: r, f1: (2 * p * r) / Math.max(1e-9, p + r), exact: exact / D.GOLD.length, tp, fp, fn, misses };
  }

  function search(text) { const out = []; for (const it of assessmentItems(text, text, 1)) for (const m of matchItem(it, null)) out.push(Object.assign(m, { status: it.status, from: it.text })); return out; }

  window.CC_AGENTS = { run, evaluate, search, parseInvoice, sections, days, addDays, addMonths };
})();
