import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const base = process.env.UI_BASE_URL ?? "http://localhost:3000";
await mkdir("docs/screenshots", { recursive: true });
const browser = await chromium.launch({ headless: false });
const errors = [];
const sizes = [
  [1440, 900],
  [1280, 720],
  [390, 844],
];
async function capture(page, name) {
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(1600);
    await page.evaluate(() => window.scrollTo(0, 0));
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      name + " has no horizontal overflow at " + width,
    );
    await page.screenshot({
      path: "docs/screenshots/" + name + "-" + width + "x" + height + ".png",
    });
    await page.screenshot({
      path:
        "docs/screenshots/" + name + "-" + width + "x" + height + "-full.png",
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
}
async function hold(page) {
  const b = page.getByRole("button", { name: "Hold to approve and run" });
  await b.focus();
  await page.keyboard.down("Space");
  await page.waitForTimeout(1150);
  await page.keyboard.up("Space");
  await page
    .locator(".notice:visible")
    .filter({ hasText: "The approved steps ran. Every change is recorded." })
    .waitFor();
}
for (let cycle = 1; cycle <= 3; cycle++) {
  execFileSync("npm", ["run", "demo:reset"], { stdio: "inherit" });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: cycle === 3 ? "reduce" : "no-preference",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await page.waitForFunction(() => document.cookie.includes("uid="));
  const seedContacts = await (
    await page.request.get(base + "/api/contacts?limit=200")
  ).json();
  assert.equal(seedContacts.contacts.length, 50);
  assert.equal(
    seedContacts.contacts.filter((c) => c.tags.includes("trial")).length,
    40,
  );
  assert.equal(seedContacts.contacts.filter((c) => c.unsubscribed).length, 3);
  const imported = await Promise.all(
    seedContacts.contacts.map(
      async (c) =>
        (
          await (
            await page.request.get(base + "/api/contacts/" + c.id + "/timeline")
          ).json()
        ).events,
    ),
  );
  assert.equal(
    imported.flat().filter((e) => e.type === "automation_decision").length,
    0,
    "Clean seed has no artificial decisions",
  );
  assert.ok(
    imported.every((events) => events.some((e) => e.type === "imported")),
    "Every clean contact has an imported event",
  );
  await page.getByRole("button", { name: "Print a preview" }).click();
  await page.getByText("74 messages scheduled", { exact: true }).waitFor();
  assert.equal(
    await page.locator(".impact-number").filter({ hasText: /^37$/ }).count(),
    1,
  );
  if (cycle === 1) {
    await capture(page, "agent");
    const b = page.getByRole("button", { name: "Hold to approve and run" });
    await b.hover();
    await page.mouse.down();
    await page.waitForTimeout(250);
    await page.mouse.up();
    assert.equal(
      await page
        .getByText("Nothing has happened yet.", { exact: true })
        .count(),
      1,
    );
  }
  await hold(page);
  console.log("Approved visible run");
  const runs = await (await page.request.get(base + "/api/runs")).json();
  const main = runs.runs[0].id;
  const ws = await (await page.request.get(base + "/api/webinars")).json();
  const w = ws.webinars[0];
  const cs = await (
    await page.request.get(base + "/api/contacts?limit=200")
  ).json();
  const person = cs.contacts.find(
    (c) => c.tags.includes("trial") && !c.unsubscribed,
  );
  await page.getByRole("link", { name: "Webinars", exact: true }).click();
  await page.getByRole("link", { name: w.title, exact: true }).click();
  await page
    .getByRole("button", { name: "Preview registration publication" })
    .click();
  await page.waitForURL("**/runs/*");
  await hold(page);
  console.log("Approved visible run");
  await page.getByRole("link", { name: "Live view", exact: true }).click();
  await page.getByLabel("Webinar", { exact: true }).selectOption(w.id);
  await page.getByLabel("Contact to observe").selectOption(person.id);
  await page.waitForTimeout(2300);
  const form = page.frameLocator('iframe[title="Public webinar registration"]');
  await form.getByLabel("Your name").fill(person.name);
  await form.getByLabel("Email address").fill(person.email);
  await form.getByRole("button", { name: "Register for the webinar" }).click();
  await form
    .getByText("You are registered. Your place is saved.", { exact: true })
    .waitFor();
  await page
    .locator(".rule-stage")
    .nth(2)
    .getByText("Reminder cancelled", { exact: true })
    .waitFor();
  await page.waitForTimeout(1600);
  assert.equal(await page.locator(".rule-stage.reached").count(), 3);
  if (cycle === 1) await capture(page, "live");
  await form.getByRole("button", { name: "Register for the webinar" }).click();
  await form
    .getByText("You are already registered. Your place is still saved.", {
      exact: true,
    })
    .waitFor();
  await page
    .getByRole("button", { name: "Run worker tick", exact: true })
    .click();
  await page.getByText(/\d+ sent, \d+ blocked/).waitFor();
  const events = await (
    await page.request.get(base + "/api/contacts/" + person.id + "/timeline")
  ).json();
  assert.equal(
    events.events.filter((e) => e.rule_id === "REMINDER_REQUIRES_UNREGISTERED")
      .length,
    1,
  );
  // The public screen has no app chrome and native invalid forms do not submit.
  const publicPage = await context.newPage();
  await publicPage.goto(base + "/register/" + w.slug);
  await publicPage.getByLabel("Your name").waitFor();
  assert.equal(await publicPage.locator("header").count(), 0);
  await publicPage
    .getByRole("button", { name: "Register for the webinar" })
    .click();
  assert.equal(await publicPage.locator("input:invalid").count(), 2);
  if (cycle === 1) await capture(publicPage, "registration");
  if (cycle === 2) {
    await publicPage.bringToFront();
    await page.waitForTimeout(1500);
    if (await page.evaluate(() => document.hidden)) {
      let polls = 0;
      const count = (r) => {
        if (r.url().includes("/timeline") || r.url().includes("/api/outbox"))
          polls++;
      };
      page.on("request", count);
      await page.waitForTimeout(4500);
      page.off("request", count);
      assert.equal(polls, 0, "Hidden Live tab pauses polling");
      console.log("Hidden-tab polling pause verified");
    } else
      console.log(
        "UNVERIFIED: Chromium automation keeps background tabs visible; native polling pause could not be exercised.",
      );
  }
  await publicPage.close();
  await page.bringToFront();
  await page
    .getByRole("link", { name: "Read the full contact timeline" })
    .click();
  await page.getByRole("heading", { name: "Every recorded change" }).waitFor();
  const rule = page
    .getByRole("button", {
      name: "REMINDER_REQUIRES_UNREGISTERED",
      exact: true,
    })
    .filter({ visible: true })
    .first();
  await rule.waitFor();
  if (cycle === 1) await capture(page, "contact-timeline");
  await rule.focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("dialog")
    .filter({
      has: page.getByRole("heading", { name: "Why this rule exists" }),
    })
    .waitFor();
  await page.keyboard.press("Tab");
  assert.ok(
    await page.evaluate(
      () => document.activeElement?.closest("dialog") !== null,
    ),
  );
  if (cycle === 1) await capture(page, "rule-inspector");
  await page.keyboard.press("Escape");
  assert.equal(await rule.evaluate((e) => e === document.activeElement), true);
  await page.goto(base + "/webinars/" + w.id);
  await page
    .getByRole("button", { name: "Close webinar", exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByText("Attendance is not simulated in this prototype.", {
        exact: true,
      })
      .count(),
    1,
  );
  assert.equal(
    await page.getByRole("button", { name: /attendance/i }).count(),
    0,
  );
  const second = cs.contacts.find(
    (c) => c.id !== person.id && c.tags.includes("trial") && !c.unsubscribed,
  );
  await page.getByLabel("Contact", { exact: true }).selectOption(second.id);
  await page
    .getByRole("button", { name: "Simulated registration", exact: true })
    .click();
  await page.getByText(/Registration recorded.*Reminder cancelled/).waitFor();
  await page
    .getByRole("button", { name: "Close webinar", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Approve", exact: true })
    .filter({ visible: true })
    .waitFor();
  await page
    .getByRole("heading", { name: "2 eligible recipients", exact: true })
    .waitFor();
  await page.waitForTimeout(500);
  await page.request.post(base + "/api/contacts/" + second.id + "/opt-out", {
    data: {},
  });
  await page
    .getByRole("button", { name: "Approve", exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByText(
      "Recipients or content changed. Nothing was queued. Review the fresh preview and approve again.",
      { exact: true },
    )
    .waitFor();
  await page
    .getByRole("button", { name: "Approve", exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByText("1 messages queued. Delivery is simulated.", { exact: true })
    .waitFor();
  await page.getByLabel("Contact", { exact: true }).selectOption(person.id);
  await page
    .getByRole("button", { name: "Simulated checkout", exact: true })
    .click();
  await page.getByText(/Simulated checkout recorded/).waitFor();
  await page
    .getByRole("button", { name: "Simulated opt-out", exact: true })
    .click();
  await page.getByText(/Contact is unsubscribed/).waitFor();
  if (cycle === 1) await capture(page, "webinar-detail");
  for (const [route, name] of [
    ["/contacts", "contacts"],
    ["/webinars", "webinars"],
    ["/runs", "runs"],
    ["/outbox", "outbox"],
    ["/analytics", "analytics"],
  ]) {
    await page.goto(base + route);
    await page.waitForTimeout(600);
    if (cycle === 1) await capture(page, name);
  }
  await page.goto(base + "/runs/" + main);
  await page
    .getByRole("button", { name: "Rewind this run", exact: true })
    .filter({ visible: true })
    .waitFor();
  if (cycle === 1) await capture(page, "run-detail");
  const queued = await (
    await page.request.get(base + "/api/outbox?status=queued&limit=200")
  ).json();
  const due = Math.min(
    ...queued.outbox.map((m) => new Date(m.dispatch_after).getTime()),
  );
  const wait = Math.max(0, due - Date.now() + 100);
  assert.ok(wait < 180000, "Stored hold window fits the demo rehearsal");
  if (wait) {
    console.log(
      "Waiting " +
        Math.ceil(wait / 1000) +
        " seconds for the actual hold window",
    );
    await page.waitForTimeout(wait);
  }
  await page
    .getByRole("button", { name: "Run worker tick", exact: true })
    .click();
  await page.getByText(/[1-9]\d* sent, \d+ blocked/).waitFor();
  await page
    .getByRole("button", { name: "Rewind this run", exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("button", { name: "Keep this run", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Rewind this run", exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm rewind", exact: true })
    .click();
  await page
    .getByText("Run rewound with limits. Review what remains below.", {
      exact: true,
    })
    .waitFor();
  assert.ok((await page.getByText(/cannot be recalled/i).count()) > 0);
  if (cycle === 1) await capture(page, "run-rewound");
  if (cycle === 3) {
    assert.equal(
      await page
        .locator(".receipt-line")
        .first()
        .evaluate((e) => getComputedStyle(e).animationName),
      "none",
    );
    assert.equal(await page.locator(".trace-rail").count(), 0);
  }
  await page.getByLabel("Demo role").selectOption("viewer");
  assert.equal(
    await page
      .getByRole("button", { name: "Run worker tick", exact: true })
      .isDisabled(),
    true,
  );
  if (cycle === 1) {
    const pairs = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return ["ink", "muted", "decision", "added", "changed", "blocked"].map(
        (k) => [
          k,
          s.getPropertyValue("--" + k).trim(),
          s.getPropertyValue("--surface").trim(),
        ],
      );
    });
    const lum = (hex) => {
      const c = hex
        .slice(1)
        .match(/../g)
        .map((x) => parseInt(x, 16) / 255)
        .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    for (const [name, fg, bg] of [
      ...pairs,
      ["button", "#1B1206", "#FFB02E"],
      ["error", "#FF8AA0", "#3D1722"],
      ["rule", "#45D9A8", "#0F2E24"],
    ]) {
      const a = lum(fg),
        b = lum(bg),
        ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      assert.ok(ratio >= 4.5, name + " contrast");
      console.log(name + " contrast " + ratio.toFixed(2) + ":1");
    }
  }
  await context.close();
  console.log("Browser rehearsal " + cycle + " ALL GREEN");
}
assert.deepEqual(errors, [], "No browser runtime errors");
await browser.close();
console.log("UI CHECKS ALL GREEN");
