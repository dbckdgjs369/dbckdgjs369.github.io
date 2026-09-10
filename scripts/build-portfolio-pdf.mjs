/**
 * 포트폴리오 PDF 빌더 — static/portfolio 의 HTML 을 읽어 A4 인쇄본 한 부로 만든다.
 *
 * 원칙: 내용을 여기에 다시 적지 않는다.
 * 메인·상세 페이지 DOM 에서 뽑아 쓰므로, 사이트를 고치면 PDF 도 같이 바뀐다.
 * (같은 내용을 두 군데 적어 두면 한쪽만 고쳐져 어긋난다 — 아코디언 때 겪은 문제)
 *
 * 실행:
 *   node scripts/build-portfolio-pdf.mjs
 * playwright 가 이 레포에 없어서, 설치된 곳을 찾아 쓴다(아래 CANDIDATES).
 */
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const SRC = path.join(ROOT, "static", "portfolio");
const OUT = path.join(SRC, "yoochangheon-portfolio.pdf");

// playwright 를 어디서 가져올지 — 이 레포에 없으면 설치된 다른 곳에서 빌려 쓴다
const CANDIDATES = [
  ROOT,
  "/Users/yoochangheon/personal_project/crypto-price-extension",
];
function loadChromium() {
  for (const base of CANDIDATES) {
    try {
      return createRequire(path.join(base, "noop.js"))("playwright").chromium;
    } catch {}
  }
  throw new Error(
    "playwright 를 찾을 수 없습니다. 다음 중 한 곳에 설치하세요:\n  " +
      CANDIDATES.join("\n  ")
  );
}

const url = (rel) => pathToFileURL(path.join(SRC, rel)).href;
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ---------- 페이지에서 내용 뽑기 ---------- */

async function readIndex(page) {
  await page.goto(url("index.html"), { waitUntil: "networkidle" });
  return page.evaluate(() => {
    const t = (el) => (el ? el.innerText.trim() : "");
    const all = (sel) => [...document.querySelectorAll(sel)];
    return {
      eyebrow: t(document.querySelector(".hero .eyebrow")),
      title: t(document.querySelector(".hero h1")),
      lede: t(document.querySelector(".hero .lede")),
      proof: all(".proof li").map((li) => ({
        big: t(li.querySelector("b")),
        sub: t(li.querySelector("span")),
      })),
      contact: all(".hero-contact a, .hero-contact .plain").map((e) => t(e)),
      ways: all("#ways .ways li, #ways ol li").map((li) => ({
        h: t(li.querySelector("h3")),
        p: t(li.querySelector("p")),
      })),
      skills: all("#skills .skillset .sk").map((d) => ({
        k: t(d.querySelector("h3")),
        v: [...d.querySelectorAll("li")].map(t).join(" · "),
      })),
    };
  });
}

async function readProject(page, file) {
  await page.goto(url(`projects/${file}`), { waitUntil: "networkidle" });
  return page.evaluate(() => {
    const t = (el) => (el ? el.innerText.trim() : "");
    const all = (sel) => [...document.querySelectorAll(sel)];
    const shot = document.querySelector("figure.shot");
    return {
      cat: t(document.querySelector(".phero .cat")),
      name: t(document.querySelector(".phero h1")),
      lede: t(document.querySelector(".phero .lede")),
      kpis: all(".p-badges .kpi").map(t),
      links: all(".p-links a").map((a) => ({ label: t(a), href: a.href })),
      why: all("#why .prose p").map(t),
      shot: shot
        ? {
            src: shot.querySelector("img")?.src || "",
            cap: t(shot.querySelector("figcaption")),
          }
        : null,
      // 결정 블록이 어느 섹션에 있는지는 페이지마다 다르다. 시세 위젯은
      // 구현 설명(#how)과 문제 해결(#problems)을 따로 두고 후자에 .dec 를 모았다.
      decs: all("#how .dec, #problems .dec").map((d) => ({
        h: t(d.querySelector("h3")),
        rows: [...d.querySelectorAll(".row")].map((r) => ({
          k: t(r.querySelector(".lbl")),
          v: t(r.querySelector(".txt")),
        })),
      })),
      result: all("#result .prose li, #result .prose p").map(t),
    };
  });
}

/* ---------- 인쇄용 문서 조립 ---------- */

const CSS = `
@page { size: A4; margin: 16mm 15mm 18mm; }
* { box-sizing: border-box; }
body {
  margin: 0; color: #1b1714; background: #fff;
  font-family: "Pretendard Variable", Pretendard, -apple-system, "Apple SD Gothic Neo", sans-serif;
  font-size: 10pt; line-height: 1.6; word-break: keep-all; overflow-wrap: anywhere;
}
b { font-weight: 600; color: #100d0a; }
.mono { font-family: "JetBrains Mono", ui-monospace, Menlo, monospace; }
.accent { color: #a83f1c; }

/* 표지 */
.cover-name { font-size: 12pt; font-weight: 700; letter-spacing: -.02em; }
.cover-role { font-family: "JetBrains Mono", monospace; font-size: 8.6pt; letter-spacing: .1em;
  text-transform: uppercase; color: #8a8073; margin-top: 2mm; }
h1.headline { font-size: 24pt; font-weight: 800; letter-spacing: -.045em; line-height: 1.28;
  margin: 8mm 0 5mm; }
h1.headline em { font-style: normal; color: #a83f1c; }
.lede { font-size: 10.6pt; color: #4b443d; max-width: 155mm; margin: 0 0 7mm; }

ul.proof { list-style: none; display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 4mm; padding: 5mm 0; margin: 0 0 6mm; border-top: .6pt solid #ddd3c4; border-bottom: .6pt solid #ddd3c4; }
ul.proof b { display: block; font-family: "JetBrains Mono", monospace; font-size: 17pt;
  font-weight: 500; letter-spacing: -.03em; color: #a83f1c; }
ul.proof b i { font-style: normal; font-size: 9pt; color: #6b6157; margin-left: 1mm; }
ul.proof span { display: block; font-size: 8.2pt; line-height: 1.5; color: #6b6157; margin-top: 1.5mm; }

.contact-row { display: flex; flex-wrap: wrap; gap: 3mm 8mm; font-size: 9.2pt; color: #4b443d; }
.contact-row .k { font-family: "JetBrains Mono", monospace; font-size: 7.8pt;
  letter-spacing: .1em; text-transform: uppercase; color: #8a8073; margin-right: 2mm; }

/* 목차 */
.toc { margin-top: 9mm; border-top: .6pt solid #ddd3c4; padding-top: 5mm; }
.toc-row { display: grid; grid-template-columns: 10mm 1fr auto; gap: 3mm;
  padding: 2.4mm 0; border-bottom: .4pt solid #efe8dc; font-size: 9.4pt; }
.toc-row .n { font-family: "JetBrains Mono", monospace; color: #a83f1c; font-size: 8.4pt; }
.toc-row .nm { font-family: "JetBrains Mono", monospace; font-weight: 500; }
.toc-row .meta { color: #8a8073; font-size: 8.4pt; text-align: right; }

/* 프로젝트 */
.proj { break-before: page; }
.p-head { border-bottom: 1.2pt solid #1b1714; padding-bottom: 3mm; margin-bottom: 5mm; }
.p-cat { font-family: "JetBrains Mono", monospace; font-size: 8pt; letter-spacing: .06em; color: #8a8073; }
.p-name { font-family: "JetBrains Mono", monospace; font-size: 17pt; font-weight: 500;
  letter-spacing: -.03em; margin: 1.5mm 0 0; }
.p-lede { font-size: 10pt; color: #4b443d; margin: 3mm 0 0; }
.kpis { display: flex; flex-wrap: wrap; gap: 2mm; margin: 4mm 0 0; padding: 0; list-style: none; }
.kpis li { font-family: "JetBrains Mono", monospace; font-size: 7.8pt; color: #4b443d;
  border: .5pt solid #ddd3c4; border-radius: 2pt; padding: .8mm 2mm; }
.p-links { font-family: "JetBrains Mono", monospace; font-size: 8.2pt; color: #6b6157; margin-top: 3mm; }
.p-links span { margin-right: 5mm; }

h2.sec { font-size: 11.5pt; font-weight: 800; letter-spacing: -.02em; margin: 5mm 0 2.5mm;
  break-after: avoid; }
h2.sec::before { content: ""; display: inline-block; width: 3mm; height: 3mm;
  background: #a83f1c; margin-right: 2.5mm; vertical-align: middle; }
.prose p { margin: 0 0 2.5mm; color: #4b443d; }

figure { margin: 4mm 0 0; break-inside: avoid; }
figure img { display: block; width: 100%; max-height: 78mm; object-fit: contain;
  object-position: center; border: .5pt solid #ddd3c4; background: #f7f3ec; padding: 2mm; }
figcaption { font-size: 8.2pt; color: #8a8073; margin-top: 2mm; }

.dec { break-inside: avoid; border-top: .5pt solid #efe8dc; padding: 2.4mm 0 .8mm; }
.dec h3 { font-size: 10pt; font-weight: 700; margin: 0 0 2mm; }
.dec .row { display: grid; grid-template-columns: 14mm 1fr; gap: 3mm; padding: 1mm 0; }
.dec .k { font-family: "JetBrains Mono", monospace; font-size: 8pt; color: #8a8073; }
.dec .row.problem .k { color: #a83f1c; }
.dec .v { font-size: 9.4pt; color: #4b443d; }

ul.res { margin: 0; padding-left: 4.5mm; }
ul.res li { margin: 1.5mm 0; color: #4b443d; }

/* 마지막 장 */
.tail { break-before: page; }
.way { break-inside: avoid; border-top: .5pt solid #efe8dc; padding: 3.5mm 0; }
.way h3 { font-size: 10.2pt; font-weight: 700; margin: 0 0 1.5mm; }
.way p { margin: 0; color: #4b443d; font-size: 9.6pt; }
.sk { display: grid; grid-template-columns: 34mm 1fr; gap: 3mm; padding: 2.8mm 0;
  border-top: .5pt solid #efe8dc; break-inside: avoid; }
.sk .k { font-family: "JetBrains Mono", monospace; font-size: 8.4pt; letter-spacing: .05em; color: #8a8073; }
.sk .v { font-size: 9.6pt; color: #4b443d; }
.closing { margin-top: 9mm; padding-top: 5mm; border-top: 1.2pt solid #1b1714;
  font-size: 12pt; font-weight: 800; letter-spacing: -.03em; line-height: 1.5; }
`;

function projectHtml(p, n) {
  const decs = p.decs
    .map(
      (d) => `<div class="dec"><h3>${esc(d.h)}</h3>${d.rows
        .map(
          (r) =>
            `<div class="row${r.k === "문제" ? " problem" : ""}"><div class="k">${esc(
              r.k
            )}</div><div class="v">${esc(r.v)}</div></div>`
        )
        .join("")}</div>`
    )
    .join("");
  return `
<section class="proj">
  <div class="p-head">
    <div class="p-cat">P${n} · ${esc(p.cat)}</div>
    <div class="p-name">${esc(p.name)}</div>
    <p class="p-lede">${esc(p.lede)}</p>
    <ul class="kpis">${p.kpis.map((k) => `<li>${esc(k)}</li>`).join("")}</ul>
    <div class="p-links">${p.links
      .map((l) => `<span>${esc(l.label.replace(/\s*↗$/, ""))} — ${esc(l.href)}</span>`)
      .join("")}</div>
  </div>

  <h2 class="sec">왜 만들었나</h2>
  <div class="prose">${p.why.map((x) => `<p>${esc(x)}</p>`).join("")}</div>

  ${
    p.shot
      ? `<figure><img src="${p.shot.src}"><figcaption>${esc(p.shot.cap)}</figcaption></figure>`
      : ""
  }

  <h2 class="sec">어떻게 만들었나</h2>
  ${decs}

  <h2 class="sec">결과</h2>
  <ul class="res">${p.result.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
</section>`;
}

function compose(ix, projects) {
  const toc = projects
    .map(
      (p, i) =>
        `<div class="toc-row"><span class="n">P${i + 1}</span><span class="nm">${esc(
          p.name
        )}</span><span class="meta">${esc(p.kpis.slice(0, 2).join(" · "))}</span></div>`
    )
    .join("");

  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<title>유창헌 · 포트폴리오</title><style>${CSS}</style></head><body>

<div class="cover-name">유창헌</div>
<div class="cover-role">${esc(ix.eyebrow)}</div>
<h1 class="headline">${ix.title.replace(/\n/g, "<br>").replace("배포", "<em>배포</em>")}</h1>
<p class="lede">${esc(ix.lede)}</p>

<ul class="proof">${ix.proof
    .map(
      (m) =>
        `<li><b>${m.big.replace(/^(\S+?)(명\+|종|초 → 0)?$/, (_, a, b) =>
          b ? `${a}<i>${b}</i>` : a
        )}</b><span>${esc(m.sub).replace(/\n/g, "<br>")}</span></li>`
    )
    .join("")}</ul>

<div class="contact-row">
  ${ix.contact.map((c) => `<span>${esc(c)}</span>`).join("")}
</div>

<div class="toc">
  <div class="toc-row" style="border:0;padding-bottom:3mm"><span class="n"></span>
    <span class="nm" style="font-family:inherit;font-weight:700">개인 프로젝트 3종</span>
    <span class="meta">전부 배포·운영 중</span></div>
  ${toc}
</div>

${projects.map((p, i) => projectHtml(p, i + 1)).join("")}

<section class="tail">
  <h2 class="sec">일하는 방식</h2>
  ${ix.ways
    .map((w) => `<div class="way"><h3>${esc(w.h)}</h3><p>${esc(w.p)}</p></div>`)
    .join("")}

  <h2 class="sec">스킬</h2>
  ${ix.skills
    .map(
      (s) =>
        `<div class="sk"><div class="k">${esc(s.k)}</div><div class="v">${esc(
          s.v
        ).replace(/\n/g, " · ")}</div></div>`
    )
    .join("")}

  <p class="closing">스택을 가리지 않고<br>원인까지 내려가는 사람을 찾고 계신다면.</p>
  <div class="contact-row" style="margin-top:5mm">
    ${ix.contact.map((c) => `<span>${esc(c)}</span>`).join("")}
  </div>
</section>

</body></html>`;
}

/* ---------- 실행 ---------- */

const chromium = loadChromium();
const browser = await chromium.launch();
const page = await browser.newPage();

const ix = await readIndex(page);
const projects = [];
for (const f of [
  "stock-price-widget.html",
  "react-code-locator.html",
  "custom-tunnel.html",
  "cc-talk.html",
]) {
  projects.push(await readProject(page, f));
}

// 뽑아온 게 비어 있으면 셀렉터가 어긋난 것 — 빈 PDF 를 내놓지 않고 여기서 끊는다
const problems = [];
if (!ix.title) problems.push("index: 헤드라인");
if (ix.proof.length === 0) problems.push("index: 성과 지표");
if (ix.ways.length === 0) problems.push("index: 일하는 방식");
if (ix.skills.length === 0) problems.push("index: 스킬");
projects.forEach((p, i) => {
  if (!p.name) problems.push(`P${i + 1}: 이름`);
  if (p.why.length === 0) problems.push(`P${i + 1}: 왜 만들었나`);
  if (p.decs.length === 0) problems.push(`P${i + 1}: 어떻게 만들었나`);
  if (p.result.length === 0) problems.push(`P${i + 1}: 결과`);
});
if (problems.length) {
  await browser.close();
  throw new Error("추출 실패 — 페이지 구조가 바뀐 것 같습니다:\n  - " + problems.join("\n  - "));
}

const html = compose(ix, projects);
const tmp = path.join(SRC, ".pdf-build.html"); // 이미지 상대경로 해석용, 끝나고 지운다
fs.writeFileSync(tmp, html);

const pdfPage = await browser.newPage();
await pdfPage.goto(pathToFileURL(tmp).href, { waitUntil: "networkidle" });
await pdfPage.pdf({
  path: OUT,
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: "<div></div>",
  footerTemplate: `<div style="width:100%;font-size:7.5pt;color:#8a8073;
    font-family:-apple-system,sans-serif;padding:0 15mm;display:flex;justify-content:space-between">
    <span>유창헌 · Frontend Developer</span>
    <span class="pageNumber"></span></div>`,
  margin: { top: "16mm", bottom: "18mm", left: "15mm", right: "15mm" },
});

fs.unlinkSync(tmp);
await browser.close();

const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(`완료: ${path.relative(ROOT, OUT)} (${kb} KB)`);
console.log(`프로젝트 ${projects.length}종 · 판단기록 ${projects.reduce((a, p) => a + p.decs.length, 0)}건`);
