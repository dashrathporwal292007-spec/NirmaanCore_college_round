const { chromium } = require("@playwright/test");
const fs = require("fs");
(async () => {
  fs.mkdirSync("docs/screenshots/reference", { recursive: true });
  const b = await chromium.launch({ headless: true });
  const report = {};
  for (const [name, width, height] of [
    ["desktop", 1440, 900],
    ["mobile", 390, 844],
  ]) {
    const p = await b.newPage({ viewport: { width, height } });
    await p.goto("https://ownitt.fr", { waitUntil: "networkidle" });
    p.setDefaultTimeout(5000);
    await p
      .getByRole("button", { name: /passer/i })
      .click()
      .catch(() => {});
    await p
      .getByText("PASSER", { exact: true })
      .click()
      .catch(() => {});
    await p.waitForTimeout(9000);
    await p.screenshot({ path: `docs/screenshots/reference/${name}-hero.png` });
    report[name] = await p.evaluate(() => {
      const pick = (el) => {
        const s = getComputedStyle(el);
        return {
          tag: el.tagName,
          class: el.className,
          text: el.innerText?.slice(0, 90),
          font: s.fontFamily,
          size: s.fontSize,
          weight: s.fontWeight,
          lineHeight: s.lineHeight,
          tracking: s.letterSpacing,
          color: s.color,
          background: s.backgroundColor,
          padding: s.padding,
          margin: s.margin,
          transition: s.transition,
          animation: s.animation,
        };
      };
      return {
        headings: [...document.querySelectorAll("h1,h2,h3")]
          .slice(0, 12)
          .map(pick),
        sections: [...document.querySelectorAll("section")]
          .slice(0, 12)
          .map(pick),
        buttons: [...document.querySelectorAll("button")].slice(0, 8).map(pick),
        animations: [...document.getAnimations()]
          .slice(0, 25)
          .map((a) => ({
            target: a.effect?.target?.className,
            timing: a.effect?.getTiming(),
          })),
      };
    });
    const menus = p.getByRole("button", { name: /menu/i });
    report[name].menuButtons = await menus.count();
    if (await menus.count()) {
      await menus.first().click({ force: true });
      await p.waitForTimeout(900);
      await p.screenshot({
        path: `docs/screenshots/reference/${name}-menu.png`,
      });
      await menus
        .first()
        .click({ force: true })
        .catch(() => {});
    }
    for (const [label, text] of [
      ["mid", "OWNITT : VERBE"],
      ["projects", "BURGER KING"],
      ["territories", "Nous exploitons cinq territoires"],
    ]) {
      const loc = p.getByText(text, { exact: false }).first();
      if (await loc.count()) {
        await loc.scrollIntoViewIfNeeded();
        await p.waitForTimeout(1000);
        if (label === "territories") {
          await p
            .getByText("STRATÉGIE", { exact: true })
            .first()
            .hover({ force: true })
            .catch(() => {});
          await p.waitForTimeout(800);
        }
        await p.screenshot({
          path: `docs/screenshots/reference/${name}-${label}.png`,
        });
      }
    }
    report[name].classes = await p.evaluate(() =>
      [
        ...document.querySelectorAll(
          '[class*="territ"],[class*="marquee"],[class*="project"],[class*="menu"]',
        ),
      ]
        .slice(0, 50)
        .map((el) => ({
          class: el.className,
          transition: getComputedStyle(el).transition,
          animation: getComputedStyle(el).animation,
          font: getComputedStyle(el).fontFamily,
          size: getComputedStyle(el).fontSize,
        })),
    );
    await p.close();
  }
  fs.writeFileSync(
    "docs/screenshots/reference/styles.json",
    JSON.stringify(report, null, 2),
  );
  await b.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
