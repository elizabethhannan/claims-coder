/* Claims Coder charts: D3 v7 with motion. Colors come from CSS tokens (--c-good, --c-ai, --c-warn, --c-accent),
   validated for color-vision deficiency in light and dark mode. Motion is skipped when the person turns it off
   or the system asks for reduced motion. Every chart has a hover tooltip and a table view. */
(function () {
  "use strict";
  const C = { good: "var(--c-good)", ai: "var(--c-ai)", warn: "var(--c-warn)", accent: "var(--c-accent)" };
  const API = { reduce: () => false, C };
  const ok = () => typeof window.d3 !== "undefined";
  const dur = (ms) => (API.reduce() ? 0 : ms);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmtInt = (n) => Number(n).toLocaleString("en-US");

  // ---------- shared pieces ----------
  let tip;
  function tooltip() {
    if (!tip) { tip = document.createElement("div"); tip.className = "d3tip"; tip.setAttribute("role", "status"); document.body.appendChild(tip); }
    return tip;
  }
  function showTip(ev, html) {
    const t = tooltip(); t.innerHTML = html; t.style.opacity = "1";
    const r = t.getBoundingClientRect(), pad = 14;
    let x = ev.clientX + pad, y = ev.clientY + pad;
    if (x + r.width > window.innerWidth - 8) x = ev.clientX - r.width - pad;
    if (y + r.height > window.innerHeight - 8) y = ev.clientY - r.height - pad;
    t.style.transform = `translate(${Math.max(8, x)}px, ${Math.max(8, y)}px)`;
  }
  function hideTip() { if (tip) tip.style.opacity = "0"; }
  const sw = (color) => `<i class="sw" style="background:${color}"></i>`;
  function legend(items) { return `<div class="d3legend">${items.map(([l, c]) => `<span>${sw(c)}${esc(l)}</span>`).join("")}</div>`; }
  function table(cols, rows) {
    return `<details class="d3table"><summary>Show as a table</summary><div class="scroll"><table><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details>`;
  }
  // Bar with 4px rounded data end only (the baseline end stays square).
  function vbar(x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h)); return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`; }
  function hbar(x, y, w, h, r) { r = Math.max(0, Math.min(r, h / 2, w)); return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`; }
  function frame(el, h, m) {
    const W = Math.max(260, el.clientWidth || 600);
    const svg = d3.select(el).selectAll("svg.d3c").data([0]).join("svg").attr("class", "d3c").attr("width", W).attr("height", h).attr("viewBox", `0 0 ${W} ${h}`);
    return { svg, W, H: h, m, iw: W - m.l - m.r, ih: h - m.t - m.b };
  }
  function grid(g, scale, len, horizontal, ticks, fmt) {
    const tk = scale.ticks(ticks);
    const gg = g.selectAll("g.grid").data([0]).join("g").attr("class", "grid");
    const ln = gg.selectAll("g.t").data(tk, (d) => d).join((en) => { const t = en.append("g").attr("class", "t"); t.append("line"); t.append("text"); return t; });
    ln.transition().duration(dur(400)).attr("transform", (d) => horizontal ? `translate(${scale(d)},0)` : `translate(0,${scale(d)})`);
    ln.select("line").attr("x1", 0).attr("y1", 0).attr("x2", horizontal ? 0 : len).attr("y2", horizontal ? len : 0);
    ln.select("text").text(fmt || ((d) => d)).attr("x", horizontal ? 0 : -6).attr("y", horizontal ? len + 16 : 0).attr("dy", horizontal ? 0 : "0.32em").attr("text-anchor", horizontal ? "middle" : "end");
    gg.lower();
  }

  // ---------- 1. Agent flow: each claim travels through the agent steps ----------
  const STAGES = ["Extract", "Match", "Validate", "Requirements", "Route", "Packet", "Approve"];
  API.flow = function (el) {
    if (!ok() || !el) return null;
    const narrow = el.clientWidth < 620;
    const f = frame(el, narrow ? 176 : 170, { l: 22, r: narrow ? 22 : 230, t: narrow ? 20 : 46, b: 10 });
    const { svg, iw, m } = f;
    const xs = d3.scalePoint().domain(STAGES).range([m.l, m.l + iw]);
    const midY = m.t + 18, lowY = midY + (narrow ? 76 : 62), tx = f.W - m.r + 70;
    // Clean claims continue to the Approval agent; open questions leave at Route and go to a person.
    // On a phone both exits drop below their step so the seven steps keep their spacing.
    const term = narrow ? [{ k: "auto", label: "Approved", x: xs("Approve"), y: lowY }, { k: "person", label: "To a person", x: xs("Route"), y: lowY }]
      : [{ k: "auto", label: "Approved by agent", x: tx, y: midY }, { k: "person", label: "To a person", x: tx, y: lowY }];
    svg.selectAll("*").remove();
    const g = svg.append("g");
    const tAuto = term[0], tPer = term[1];
    const link = (a, b) => narrow ? `M${a.x},${a.y}V${b.y - 13}` : b.y === a.y ? `M${a.x},${a.y}H${b.x - 15}` : `M${a.x},${a.y}C${a.x + 26},${a.y} ${a.x + 26},${b.y} ${a.x + 56},${b.y}H${b.x - 15}`;
    g.append("line").attr("class", "track").attr("x1", xs(STAGES[0])).attr("x2", xs(STAGES[6])).attr("y1", midY).attr("y2", midY);
    g.append("path").attr("class", "track").attr("d", link({ x: xs("Approve"), y: midY }, tAuto));
    g.append("path").attr("class", "track").attr("d", link({ x: xs("Route"), y: midY }, tPer));
    const nodes = g.selectAll("g.node").data(STAGES).join("g").attr("class", "node").attr("transform", (d) => `translate(${xs(d)},${midY})`);
    nodes.append("circle").attr("r", 15).attr("class", "nd");
    nodes.append("text").attr("class", "num").attr("dy", "0.34em").attr("text-anchor", "middle").text((d, i) => i + 1);
    if (!narrow) nodes.append("text").attr("class", "lab").attr("y", -26).attr("text-anchor", "middle").text((d) => d);
    const terms = g.selectAll("g.term").data(term).join("g").attr("class", "term").attr("transform", (d) => `translate(${d.x},${d.y})`);
    terms.append("circle").attr("r", 13).style("fill", (d) => d.k === "auto" ? C.good : C.warn);
    terms.append("text").attr("class", "lab").attr("x", narrow ? 0 : 20).attr("y", narrow ? 30 : -3).attr("text-anchor", narrow ? "middle" : "start").text((d) => d.label);
    terms.append("text").attr("class", "cnt").attr("x", narrow ? 0 : 20).attr("y", narrow ? 47 : 15).attr("text-anchor", narrow ? "middle" : "start");
    const hit = g.selectAll("rect.hit").data(STAGES).join("rect").attr("class", "hit").attr("x", (d) => xs(d) - 24).attr("y", midY - 44).attr("width", 48).attr("height", 70)
      .on("mousemove", (ev, d) => showTip(ev, `<b>${STAGES.indexOf(d) + 1} ${esc(d)}</b><br>${esc(API.stageAgents[STAGES.indexOf(d)] || "")}`)).on("mouseleave", hideTip);
    hit.lower();
    const layer = g.append("g");
    let counts = { auto: 0, person: 0, ready: 0 };
    function setCounts(c) { counts = c; terms.select("text.cnt").text((d) => fmtInt(d.k === "auto" ? c.auto : c.person)); }
    function glow(stage) {
      const n = nodes.filter((d) => d === stage).select("circle");
      n.interrupt().classed("on", true).transition().duration(dur(500)).on("end", () => n.classed("on", false));
    }
    function pulse(outcome) {
      // outcome: "auto" | "person" | "ready"
      const end = outcome === "person" ? tPer : outcome === "auto" ? tAuto : { x: xs("Approve"), y: midY };
      const lastStage = outcome === "person" ? 4 : 6;
      if (API.reduce()) { glow(STAGES[lastStage]); return; }
      const dot = layer.append("circle").attr("class", "packet").attr("r", 6).attr("cx", xs(STAGES[0])).attr("cy", midY).style("fill", C.ai);
      let tr = dot.transition().duration(1);
      for (let i = 0; i <= lastStage; i++) {
        const s = STAGES[i];
        tr = tr.transition().duration(i === 0 ? 200 : 330).ease(d3.easeCubicInOut).attr("cx", xs(s)).on("end", () => glow(s));
      }
      tr.transition().duration(480).ease(d3.easeCubicInOut).attrTween("transform", () => {
        const p = svg.append("path").attr("d", outcome === "ready" ? `M${end.x},${end.y}L${end.x},${end.y}` : link({ x: xs(STAGES[lastStage]), y: midY }, end)).attr("visibility", "hidden").node();
        const L = p.getTotalLength(), x0 = xs(STAGES[lastStage]);
        return (t) => { const pt = p.getPointAtLength(t * L); if (t === 1) p.remove(); return `translate(${pt.x - x0},${pt.y - midY})`; };
      }).style("fill", outcome === "person" ? C.warn : C.good)
        .transition().duration(260).attr("r", 14).style("opacity", 0).remove();
    }
    return { pulse, setCounts };
  };
  API.stageAgents = ["Reader, Privacy guard, Fact extractor", "Diagnosis matcher, Invoice coder", "Validator, Code reviewer", "Requirements agent, History agent", "Router: open questions go to a person", "Packet agent", "Approval agent: clean claims under the limit"];

  // ---------- 2. Streaming bars: time to code, last 30 claims ----------
  const OUT = { auto: ["Approved by the Approval agent", C.good], ready: ["Ready, waiting for a person's OK", C.accent], person: ["Handed to a person", C.warn] };
  API.stream = function (el) {
    if (!ok() || !el) return null;
    const f = frame(el, 220, { l: 40, r: 10, t: 12, b: 26 });
    const { svg, iw, ih, m } = f;
    svg.selectAll("*").remove();
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    const bars = g.append("g");
    const y = d3.scaleLinear().range([ih, 0]);
    const x = d3.scaleBand().range([0, iw]).paddingInner(0.25).paddingOuter(0.1);
    g.append("text").attr("class", "axl").attr("x", 0).attr("y", ih + 20).text("older");
    g.append("text").attr("class", "axl").attr("x", iw).attr("y", ih + 20).attr("text-anchor", "end").text("newest");
    function update(items) {
      const data = items.slice(-30);
      x.domain(data.map((d) => d.id));
      y.domain([0, Math.max(6, d3.max(data, (d) => d.ms / 1000) * 1.1)]).nice();
      grid(g, y, iw, false, 4, (d) => d + " s");
      const bw = Math.min(24, x.bandwidth());
      const off = (x.bandwidth() - bw) / 2;
      const sel = bars.selectAll("path").data(data, (d) => d.id);
      sel.exit().transition().duration(dur(400)).attr("transform", `translate(${-x.step()},0)`).style("opacity", 0).remove();
      const en = sel.enter().append("path").attr("transform", `translate(${iw},0)`).attr("d", (d) => vbar(off, ih, bw, 0, 4)).style("fill", (d) => OUT[d.outcome][1]);
      en.merge(sel).on("mousemove", (ev, d) => showTip(ev, `<b>Claim ${esc(d.label)}</b><br>${(d.ms / 1000).toFixed(1)} s to code<br>${sw(OUT[d.outcome][1])}${esc(OUT[d.outcome][0])}`)).on("mouseleave", hideTip)
        .transition().duration(dur(600)).ease(d3.easeCubicOut)
        .attr("transform", (d) => `translate(${x(d.id)},0)`)
        .attr("d", (d) => vbar(off, y(d.ms / 1000), bw, ih - y(d.ms / 1000), 4));
      g.selectAll("line.base").data([0]).join("line").attr("class", "base").attr("x1", 0).attr("x2", iw).attr("y1", ih).attr("y2", ih);
    }
    return { update, legend: legend(Object.values(OUT)) };
  };

  // ---------- 3. Error rate per agent, with the 5% warning line ----------
  API.errors = function (el) {
    if (!ok() || !el) return null;
    const rowH = 22;
    let f, g, x, y, built = 0;
    function build(n) {
      const narrow = el.clientWidth < 520;
      f = frame(el, n * rowH + 56, { l: narrow ? 118 : 140, r: 16, t: 22, b: 30 });
      f.svg.selectAll("*").remove();
      g = f.svg.append("g").attr("transform", `translate(${f.m.l},${f.m.t})`);
      x = d3.scaleLinear().range([0, f.iw]);
      y = d3.scaleBand().range([0, n * rowH]).paddingInner(0.3);
      built = n;
    }
    function update(rows) {
      if (built !== rows.length) build(rows.length);
      x.domain([0, Math.max(0.06, d3.max(rows, (d) => d.rate) * 1.15)]);
      y.domain(rows.map((d) => d.name));
      grid(g, x, rows.length * rowH, true, 4, (d) => (d * 100).toFixed(0) + "%");
      const bh = Math.min(16, y.bandwidth());
      g.selectAll("text.rl").data(rows, (d) => d.name).join("text").attr("class", "rl").attr("x", -8).attr("y", (d) => y(d.name) + y.bandwidth() / 2).attr("dy", "0.32em").attr("text-anchor", "end").text((d) => d.name);
      g.selectAll("path.b").data(rows, (d) => d.name).join((en) => en.append("path").attr("class", "b").attr("d", (d) => hbar(0, y(d.name) + (y.bandwidth() - bh) / 2, 0, bh, 4)))
        .style("fill", (d) => d.security ? C.ai : C.accent)
        .on("mousemove", (ev, d) => showTip(ev, `<b>${esc(d.name)}</b><br>Error rate ${(d.rate * 100).toFixed(2)}%<br>${fmtInt(d.errors)} of ${fmtInt(d.tasks)} tasks<br>Uptime ${(d.up * 100).toFixed(2)}%`)).on("mouseleave", hideTip)
        .transition().duration(dur(700)).ease(d3.easeCubicOut)
        .attr("d", (d) => hbar(0, y(d.name) + (y.bandwidth() - bh) / 2, Math.max(2, x(d.rate)), bh, 4));
      const lim = g.selectAll("g.lim").data([0.05]).join((en) => { const t = en.append("g").attr("class", "lim"); t.append("line"); t.append("text"); return t; });
      lim.transition().duration(dur(400)).attr("transform", (d) => `translate(${x(d)},0)`);
      lim.select("line").attr("y1", -4).attr("y2", rows.length * rowH);
      lim.select("text").attr("x", 0).attr("y", -10).attr("text-anchor", "middle").text("Warning at 5%");
    }
    return { update, legend: legend([["Working agent", C.accent], ["Security agent (always on)", C.ai]]) };
  };

  // ---------- 4. Gantt: how long each agent step took on one claim ----------
  API.gantt = function (el, steps) {
    if (!ok() || !el) return null;
    const narrow = el.clientWidth < 480;
    const rowH = 30;
    const f = frame(el, steps.length * rowH + 42, { l: narrow ? 96 : 118, r: 54, t: 6, b: 30 });
    const { svg, iw, m } = f;
    svg.selectAll("*").remove();
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    const total = d3.max(steps, (d) => d.start + d.ms) || 1;
    const x = d3.scaleLinear().domain([0, total]).range([0, iw]).nice();
    const y = d3.scaleBand().domain(steps.map((d) => d.label)).range([0, steps.length * rowH]).paddingInner(0.35);
    const fmtMs = (v) => v < 1000 ? Math.round(v) + " ms" : (v / 1000).toFixed(1) + " s";
    grid(g, x, steps.length * rowH, true, narrow ? 3 : 5, fmtMs);
    g.selectAll("text.rl").data(steps).join("text").attr("class", "rl").attr("x", -8).attr("y", (d) => y(d.label) + y.bandwidth() / 2).attr("dy", "0.32em").attr("text-anchor", "end").text((d) => d.label);
    const bh = Math.min(18, y.bandwidth());
    const bars = g.selectAll("path.b").data(steps).join("path").attr("class", "b").style("fill", (d) => d.warn ? C.warn : d.kind === "approve" ? C.good : C.ai)
      .on("mousemove", (ev, d) => showTip(ev, `<b>${esc(d.label)}</b><br>${esc(d.agents)}<br>Started at +${fmtMs(d.start)}, took ${fmtMs(d.ms)}${d.warn ? "<br>Flagged for a person" : ""}`)).on("mouseleave", hideTip);
    const vals = g.selectAll("text.v").data(steps).join("text").attr("class", "v").attr("y", (d) => y(d.label) + y.bandwidth() / 2).attr("dy", "0.32em").text((d) => fmtMs(d.ms));
    const scan = g.append("line").attr("class", "scan").attr("y1", -4).attr("y2", steps.length * rowH);
    function play() {
      // Replays the run at real proportions, compressed to about 2.4 seconds.
      const k = API.reduce() ? 0 : 2400 / total;
      bars.interrupt().attr("d", (d) => hbar(x(d.start), y(d.label) + (y.bandwidth() - bh) / 2, 0, bh, 4))
        .transition().delay((d) => d.start * k).duration((d) => Math.max(120, d.ms * k) * (k ? 1 : 0)).ease(d3.easeLinear)
        .attr("d", (d) => hbar(x(d.start), y(d.label) + (y.bandwidth() - bh) / 2, Math.max(3, x(d.start + d.ms) - x(d.start)), bh, 4));
      vals.interrupt().attr("x", (d) => x(d.start + d.ms) + 6).style("opacity", k ? 0 : 1).transition().delay((d) => (d.start + d.ms) * k).duration(dur(200)).style("opacity", 1);
      scan.interrupt().attr("x1", 0).attr("x2", 0).style("opacity", k ? 1 : 0).transition().duration(total * k).ease(d3.easeLinear).attr("x1", x(total)).attr("x2", x(total)).transition().duration(300).style("opacity", 0);
    }
    play();
    return { play };
  };

  // ---------- 5. Coded findings by body system, confirmed and suspected ----------
  API.systems = function (el, rows) {
    if (!ok() || !el) return null;
    const rowH = 26;
    const narrow = el.clientWidth < 420;
    const f = frame(el, rows.length * rowH + 40, { l: narrow ? 92 : 110, r: 30, t: 4, b: 28 });
    const { svg, iw, m } = f;
    svg.selectAll("*").remove();
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    const x = d3.scaleLinear().domain([0, d3.max(rows, (d) => d.confirmed + d.suspected) || 1]).range([0, iw]).nice();
    const y = d3.scaleBand().domain(rows.map((d) => d.system)).range([0, rows.length * rowH]).paddingInner(0.3);
    grid(g, x, rows.length * rowH, true, Math.min(5, x.domain()[1]), d3.format("d"));
    g.selectAll("text.rl").data(rows).join("text").attr("class", "rl").attr("x", -8).attr("y", (d) => y(d.system) + y.bandwidth() / 2).attr("dy", "0.32em").attr("text-anchor", "end").text((d) => d.system);
    const bh = Math.min(18, y.bandwidth());
    const yb = (d) => y(d.system) + (y.bandwidth() - bh) / 2;
    const tipf = (ev, d) => showTip(ev, `<b>${esc(d.system)}</b><br>${sw(C.good)}${d.confirmed} confirmed<br>${sw(C.warn)}${d.suspected} suspected (rule-outs held back)<br><span class="muted">${esc(d.terms.join(", "))}</span>`);
    // Confirmed segment, then a 2px surface gap, then suspected with the rounded end.
    g.selectAll("path.c").data(rows).join("path").attr("class", "c").style("fill", C.good).attr("d", (d) => hbar(0, yb(d), 0, bh, d.suspected ? 0 : 4))
      .on("mousemove", tipf).on("mouseleave", hideTip)
      .transition().delay((d, i) => dur(i * 60)).duration(dur(700)).ease(d3.easeCubicOut).attr("d", (d) => hbar(0, yb(d), x(d.confirmed), bh, d.suspected ? 0 : 4));
    g.selectAll("path.s").data(rows.filter((d) => d.suspected)).join("path").attr("class", "s").style("fill", C.warn).attr("d", (d) => hbar(x(d.confirmed) + (d.confirmed ? 2 : 0), yb(d), 0, bh, 4))
      .on("mousemove", tipf).on("mouseleave", hideTip)
      .transition().delay((d, i) => dur(700 + i * 60)).duration(dur(500)).ease(d3.easeCubicOut).attr("d", (d) => hbar(x(d.confirmed) + (d.confirmed ? 2 : 0), yb(d), Math.max(2, x(d.suspected) - (d.confirmed ? 2 : 0)), bh, 4));
    g.selectAll("text.v").data(rows).join("text").attr("class", "v").attr("x", (d) => x(d.confirmed + d.suspected) + 6).attr("y", (d) => yb(d) + bh / 2).attr("dy", "0.32em").text((d) => d.confirmed + d.suspected)
      .style("opacity", 0).transition().delay(dur(900)).duration(dur(300)).style("opacity", 1);
    return {};
  };

  // ---------- 6. Public data: claims per month (area + line, drawn in) ----------
  API.monthly = function (el, rows) {
    if (!ok() || !el) return null;
    const f = frame(el, 260, { l: 52, r: 16, t: 14, b: 30 });
    const { svg, iw, ih, m } = f;
    svg.selectAll("*").remove();
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    const data = rows.map(([k, v]) => ({ d: new Date(k + "-15T12:00:00"), k, v }));
    const x = d3.scaleTime().domain(d3.extent(data, (d) => d.d)).range([0, iw]);
    const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d.v)]).range([ih, 0]).nice();
    grid(g, y, iw, false, 4, d3.format(","));
    const xa = g.append("g").attr("class", "xa").attr("transform", `translate(0,${ih})`);
    xa.selectAll("text").data(x.ticks(d3.timeYear.every(1))).join("text").attr("x", (d) => x(d)).attr("y", 20).attr("text-anchor", "start").text(d3.timeFormat("%Y"));
    const area = d3.area().x((d) => x(d.d)).y0(ih).y1((d) => y(d.v)).curve(d3.curveMonotoneX);
    const line = d3.line().x((d) => x(d.d)).y((d) => y(d.v)).curve(d3.curveMonotoneX);
    const clip = "clip" + Math.random().toString(36).slice(2, 8);
    const cr = svg.append("clipPath").attr("id", clip).append("rect").attr("x", 0).attr("y", -10).attr("height", ih + 20).attr("width", API.reduce() ? iw : 0);
    g.append("path").datum(data).attr("class", "area").attr("d", area).style("fill", C.accent).attr("clip-path", `url(#${clip})`);
    g.append("path").datum(data).attr("class", "ln").attr("d", line).style("stroke", C.accent).attr("clip-path", `url(#${clip})`);
    cr.transition().duration(dur(1800)).ease(d3.easeCubicInOut).attr("width", iw);
    const last = data[data.length - 1];
    g.append("text").attr("class", "v").attr("x", x(last.d) - 6).attr("y", y(last.v) - 12).attr("text-anchor", "end").text(fmtInt(last.v) + " in Dec 2020").style("opacity", 0).transition().delay(dur(1700)).duration(dur(300)).style("opacity", 1);
    const cross = g.append("line").attr("class", "cross").attr("y1", 0).attr("y2", ih).style("opacity", 0);
    const mk = g.append("circle").attr("class", "mk").attr("r", 5).style("fill", C.accent).style("opacity", 0);
    const bis = d3.bisector((d) => d.d).center;
    g.append("rect").attr("class", "hit").attr("width", iw).attr("height", ih + 10)
      .on("mousemove", (ev) => { const [px] = d3.pointer(ev); const d = data[bis(data, x.invert(px))]; cross.attr("x1", x(d.d)).attr("x2", x(d.d)).style("opacity", 1); mk.attr("cx", x(d.d)).attr("cy", y(d.v)).style("opacity", 1);
        showTip(ev, `<b>${d3.timeFormat("%B %Y")(d.d)}</b><br>${fmtInt(d.v)} claims`); })
      .on("mouseleave", () => { cross.style("opacity", 0); mk.style("opacity", 0); hideTip(); });
    return {};
  };

  // ---------- 7. Public data: claim amount distribution ----------
  API.amounts = function (el, rows) {
    if (!ok() || !el) return null;
    const rowH = 24;
    const f = frame(el, rows.length * rowH + 40, { l: 104, r: 54, t: 4, b: 28 });
    const { svg, iw, m } = f;
    svg.selectAll("*").remove();
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    const total = d3.sum(rows, (d) => d[1]);
    const x = d3.scaleLinear().domain([0, d3.max(rows, (d) => d[1])]).range([0, iw]).nice();
    const y = d3.scaleBand().domain(rows.map((d) => d[0])).range([0, rows.length * rowH]).paddingInner(0.3);
    grid(g, x, rows.length * rowH, true, 3, d3.format("~s"));
    g.selectAll("text.rl").data(rows).join("text").attr("class", "rl").attr("x", -8).attr("y", (d) => y(d[0]) + y.bandwidth() / 2).attr("dy", "0.32em").attr("text-anchor", "end").text((d) => d[0]);
    const bh = Math.min(16, y.bandwidth());
    const yb = (d) => y(d[0]) + (y.bandwidth() - bh) / 2;
    g.selectAll("path.b").data(rows).join("path").attr("class", "b").style("fill", C.accent).attr("d", (d) => hbar(0, yb(d), 0, bh, 4))
      .on("mousemove", (ev, d) => showTip(ev, `<b>${esc(d[0])}</b><br>${fmtInt(d[1])} claims<br>${(100 * d[1] / total).toFixed(1)}% of all claims`)).on("mouseleave", hideTip)
      .transition().delay((d, i) => dur(i * 70)).duration(dur(650)).ease(d3.easeCubicOut).attr("d", (d) => hbar(0, yb(d), Math.max(2, x(d[1])), bh, 4));
    const top = rows.reduce((a, b) => (b[1] > a[1] ? b : a));
    g.selectAll("text.v").data([top]).join("text").attr("class", "v").attr("x", (d) => x(d[1]) + 6).attr("y", (d) => yb(d) + bh / 2).attr("dy", "0.32em").text((d) => Math.round(100 * d[1] / total) + "%")
      .style("opacity", 0).transition().delay(dur(1100)).duration(dur(300)).style("opacity", 1);
    return {};
  };


  // ---------- 8. Claim growth bar: how far one claim is through the process ----------
  // p = { done: 0..8, tone: "ai"|"good"|"warn"|"accent", stages: [{ label, time }], now: label of where it is }
  API.growth = function (el, p) {
    if (!ok() || !el) return null;
    const narrow = el.clientWidth < 620;
    const f = frame(el, narrow ? 78 : 92, { l: 10, r: 14, t: narrow ? 14 : 30, b: 10 });
    const { svg, iw, m } = f;
    svg.selectAll("*").remove();
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    const n = p.stages.length, x = d3.scaleLinear().domain([0, n]).range([0, iw]);
    const bh = 14, cy = 8;
    g.append("rect").attr("class", "gtrack").attr("x", 0).attr("y", cy - bh / 2).attr("width", iw).attr("height", bh).attr("rx", bh / 2);
    const fill = g.append("rect").attr("class", "gfill").attr("x", 0).attr("y", cy - bh / 2).attr("height", bh).attr("rx", bh / 2).attr("width", 0).style("fill", C[p.tone] || C.ai);
    const ticks = g.selectAll("g.gt").data(p.stages).join("g").attr("class", "gt").attr("transform", (d, i) => `translate(${x(i + 1) - (i === n - 1 ? 0 : 0)},0)`);
    ticks.append("line").attr("y1", cy - bh / 2).attr("y2", cy + bh / 2).attr("class", (d, i) => i === n - 1 ? "gsep last" : "gsep");
    const lx = (i) => x(i + 0.5);
    g.selectAll("text.gl").data(p.stages).join("text").attr("class", (d, i) => "gl" + (i < Math.ceil(p.done) ? " on" : "")).attr("x", (d, i) => lx(i)).attr("y", narrow ? cy + 26 : -10).attr("text-anchor", "middle").text((d, i) => narrow ? i + 1 : d.label);
    if (!narrow) g.selectAll("text.gtime").data(p.stages).join("text").attr("class", "gtime").attr("x", (d, i) => lx(i)).attr("y", cy + 28).attr("text-anchor", "middle").text((d) => d.time || "—");
    const head = g.append("g").attr("class", "ghead" + (p.done < n ? " live" : "")).attr("transform", `translate(0,${cy})`);
    head.append("circle").attr("class", "ring").attr("r", 9).style("stroke", C[p.tone] || C.ai);
    head.append("circle").attr("r", 7).style("fill", C[p.tone] || C.ai);
    const hit = g.selectAll("rect.hit").data(p.stages).join("rect").attr("class", "hit").attr("x", (d, i) => x(i)).attr("width", x(1)).attr("y", -26).attr("height", 60)
      .on("mousemove", (ev, d) => { const i = p.stages.indexOf(d); showTip(ev, `<b>${i + 1} ${esc(d.label)}</b><br>${i < Math.floor(p.done) ? "Done" : i < p.done ? "In progress" : "Not yet"}${d.time ? " · " + esc(d.time) : ""}${d.who ? "<br>" + esc(d.who) : ""}`); }).on("mouseleave", hideTip);
    function grow() {
      const w = x(p.done), k = API.reduce() ? 0 : 1;
      fill.interrupt().attr("width", k ? 0 : w).transition().duration(1400 * k).ease(d3.easeCubicOut).attr("width", Math.max(bh, w));
      head.interrupt().attr("transform", `translate(${k ? 0 : w},${cy})`).transition().duration(1400 * k).ease(d3.easeCubicOut).attr("transform", `translate(${Math.max(7, w - (p.done >= n ? 7 : 0))},${cy})`);
      g.selectAll("text.gl").classed("on", false).transition().delay((d, i) => 1400 * k * (i + 1) / Math.max(1, p.done)).duration(0).on("end", function (d, i) { d3.select(this).classed("on", i < Math.ceil(p.done)); });
    }
    grow();
    return { grow };
  };
  // Small growth bars in a table: each <span class="mgrow" data-p="0..1" data-tone="..."> fills with motion.
  API.miniGrowth = function (root) {
    if (!ok() || !root) return;
    d3.select(root).selectAll(".mgrow i").each(function () {
      const el = this, p = +el.parentNode.dataset.p, tone = el.parentNode.dataset.tone;
      d3.select(el).style("background", C[tone] || C.ai).style("width", API.reduce() ? p * 100 + "%" : "0%")
        .transition().delay(dur(150)).duration(dur(1100)).ease(d3.easeCubicOut).style("width", p * 100 + "%");
    });
  };

  API.legend = legend; API.table = table;
  window.CC_CHARTS = API;
})();
