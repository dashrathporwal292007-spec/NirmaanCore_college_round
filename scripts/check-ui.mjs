import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.UI_BASE_URL ?? "http://localhost:3000";
await mkdir("docs/screenshots", { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(base);
await page.getByRole("button", { name: "Print a preview" }).click();
await page.getByText("37", { exact: true }).first().waitFor();
assert.equal(
  await page.getByText("74 messages scheduled", { exact: true }).count(),
  1,
);
assert.equal(
  await page.getByText("Nothing has happened yet.", { exact: true }).count(),
  1,
);
for (const [width, height] of [
  [1440, 900],
  [1280, 720],
  [390, 844],
]) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(1800);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "No horizontal viewport overflow",
  );
  await page.screenshot({
    path: `docs/screenshots/agent-${width}x${height}.png`,
  });
  await page.screenshot({
    path: `docs/screenshots/agent-${width}x${height}-full.png`,
    fullPage: true,
  });
}
await page.setViewportSize({ width: 1440, height: 900 });
const hold = page.getByRole("button", { name: "Hold to approve and run" });
await hold.hover();
await page.mouse.down();
await page.waitForTimeout(250);
await page.mouse.up();
assert.equal(
  await page.getByText("Nothing has happened yet.", { exact: true }).count(),
  1,
);
await hold.focus();
await page.keyboard.down("Space");
await page.waitForTimeout(1150);
await page.keyboard.up("Space");
await page
  .getByText("The approved steps ran. Every change is recorded.")
  .waitFor();
await page.screenshot({
  path: "docs/screenshots/agent-committed.png",
  fullPage: true,
});
const runList = await (await page.request.get(base + "/api/runs")).json();
const committed = await (
  await page.request.get(base + "/api/runs/" + runList.runs[0].id)
).json();
const webinar = committed.steps.find((s) => s.tool === "create_webinar").result;
const publish = await (
  await page.request.post(base + "/api/agent/plan", {
    data: {
      instruction: "Publish the registration page",
      plan: {
        summary: "Publish registration page",
        deferred: [],
        steps: [{ tool: "publish_page", args: { page_id: webinar.page_id } }],
      },
    },
  })
).json();
assert.equal(publish.status, "awaiting_approval");
assert.equal(
  (
    await (
      await page.request.post(base + "/api/agent/approve", {
        data: { run_id: publish.runId, decision: "approved" },
      })
    ).json()
  ).status,
  "completed",
);
const contacts = await (
  await page.request.get(base + "/api/contacts?tag=trial&limit=200")
).json();
const person = contacts.contacts.find(
  (c) => c.name === "Brew & Bean Cafe (Bandra)",
);
assert.equal(
  (
    await (
      await page.request.post(base + "/s/" + webinar.slug + "/register", {
        data: { name: person.name, email: person.email },
      })
    ).json()
  ).registered,
  true,
);
await page
  .getByRole("button", { name: "Rewind this run", exact: true })
  .click();
await page.getByRole("button", { name: "Keep this run" }).click();
assert.equal(
  await page
    .getByRole("button", { name: "Rewind this run", exact: true })
    .count(),
  1,
);
await page
  .getByRole("button", { name: "Rewind this run", exact: true })
  .click();
await page.getByRole("button", { name: "Confirm rewind" }).click();
await page
  .getByText(/Run rewound with limits|The reversible changes were rewound/)
  .waitFor();
await page.screenshot({
  path: "docs/screenshots/agent-rewound.png",
  fullPage: true,
});
await page.getByRole("button", { name: "Ask about a webinar" }).click();
await page.getByRole("button", { name: "Print a preview" }).click();
await page
  .getByText("On which date should the webinar run?", { exact: true })
  .waitFor()
  .catch(async (e) => {
    console.log(await page.locator("body").innerText());
    throw e;
  });
assert.equal(
  await page.locator("main").getByRole("alert").count(),
  0,
  "Clarification is not an application error",
);
await page.getByRole("link", { name: "3 Contacts" }).click();
await page
  .getByRole("button", { name: "Brew & Bean Cafe (Bandra)", exact: true })
  .waitFor();
await page
  .getByRole("button", { name: "Brew & Bean Cafe (Bandra)", exact: true })
  .click();
await page.getByRole("heading", { name: "Contact timeline" }).waitFor();
await page.getByRole("link", { name: "2 Live view" }).click();
await page
  .getByRole("button", { name: "Brew & Bean Cafe (Bandra)", exact: true })
  .click();
await page.getByRole("heading", { name: "Rule trace" }).waitFor();
await page
  .getByText("REMINDER_REQUIRES_UNREGISTERED", { exact: true })
  .waitFor();
await page.screenshot({
  path: "docs/screenshots/live-view.png",
  fullPage: true,
});
await page.getByRole("link", { name: "5 Outbox" }).click();
await page.locator(".pill").filter({ hasText: "cancelled" }).first().waitFor();
await page.getByRole("link", { name: "6 Runs" }).click();
await page.getByRole("button", { name: /Run / }).first().waitFor();
await page.getByRole("link", { name: "1 Agent" }).click();
await page.getByRole("button", { name: "Tag trial contacts" }).click();
await page.getByRole("button", { name: "Print a preview" }).click();
await page
  .getByText(
    "This low-risk request ran automatically. Review the receipt and rewind if needed.",
  )
  .waitFor();
await page.getByRole("combobox", { name: "Demo role" }).selectOption("viewer");
assert.equal(
  await page.getByRole("button", { name: "Run worker tick" }).isDisabled(),
  true,
);
await page.getByRole("combobox", { name: "Demo role" }).selectOption("owner");
await page.getByRole("button", { name: "Run worker tick" }).click();
await page.getByText(/\d+ sent, \d+ blocked/).waitFor();
await page.emulateMedia({ reducedMotion: "reduce" });
assert.equal(
  await page
    .locator(".receipt-line")
    .first()
    .evaluate((el) => getComputedStyle(el).animationName),
  "none",
);
const pairs = await page.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  return ["ink", "muted", "decision", "added", "changed", "blocked"].map(
    (role) => [
      role,
      s.getPropertyValue("--" + role).trim(),
      s.getPropertyValue("--surface").trim(),
    ],
  );
});
function luminance(hex) {
  const v = hex
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
for (const [role, fg, bg] of [
  ...pairs,
  ["button", "#1B1206", "#FFB02E"],
  ["rule", "#45D9A8", "#0F2E24"],
  ["error", "#FF8AA0", "#3D1722"],
]) {
  const a = luminance(fg),
    b = luminance(bg),
    ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  assert.ok(ratio >= 4.5, `${role} contrast ${ratio}`);
  console.log(`${role} contrast ${ratio.toFixed(2)}:1`);
}
assert.deepEqual(errors, [], "No browser runtime errors");
await browser.close();
console.log("UI CHECKS ALL GREEN");
