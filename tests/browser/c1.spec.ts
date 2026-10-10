import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
test("C1: admin setup and technician invite join", async ({
  page,
  browser,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1:")) external.push(r.url());
  });
  await page.goto("/");
  await page.screenshot({
    path: "test-results/c1-welcome.png",
    fullPage: true,
  });
  await expect(
    page.getByRole("heading", { name: "Welcome to DAYLY" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Continue as Admin" }).click();
  await page.getByLabel("Company name").fill("C1 Workshop");
  await page.getByLabel("Your name").fill("Ife Ogun");
  await page
    .getByLabel("Email", { exact: true })
    .fill(`${randomUUID()}@example.test`);
  await page.getByLabel("Password").fill("local-browser-test-passphrase");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Company setup" }),
  ).toBeVisible();
  const departments = page.locator("section.panel").filter({
    has: page.getByRole("heading", { name: "Departments", exact: true }),
  });
  await departments.getByLabel("Name", { exact: true }).fill("Operations");
  await departments.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    departments.getByRole("cell", { name: "Operations", exact: true }),
  ).toBeVisible();
  const sections = page.locator("section.panel").filter({
    has: page.getByRole("heading", { name: "Sections", exact: true }),
  });
  await sections
    .getByRole("combobox", { name: "Parent", exact: true })
    .selectOption({ label: "Operations" });
  await sections.getByLabel("Name", { exact: true }).fill("Workshop");
  await sections.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    sections.getByRole("cell", { name: "Workshop", exact: true }),
  ).toBeVisible();
  const types = page.locator("section.panel").filter({
    has: page.getByRole("heading", { name: "Equipment types", exact: true }),
  });
  await types
    .getByRole("combobox", { name: "Parent", exact: true })
    .selectOption({ label: "Workshop" });
  await types.getByLabel("Name", { exact: true }).fill("Tractor");
  await types.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    types.getByRole("cell", { name: "Tractor", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Equipment", exact: true }).click();
  for (let n = 1; n <= 3; n++) {
    await page
      .getByRole("combobox", { name: "Parent", exact: true })
      .selectOption({ label: "Tractor" });
    await page.getByLabel("Unit code").fill(`UNIT-${n}`);
    await page.getByLabel("Unit label").fill(`Unit ${n}`);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      page.getByRole("cell", { name: `UNIT-${n}`, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("tab", { name: "Details form", exact: true }).click();
  for (let n = 1; n <= 2; n++) {
    await page
      .getByRole("combobox", { name: "Parent", exact: true })
      .selectOption({ label: "Tractor" });
    await page.getByLabel("Field key").fill(`field${n}`);
    await page.getByLabel("Label", { exact: true }).fill(`Field ${n}`);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      page.getByRole("cell", { name: `Field ${n}`, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("tab", { name: "Checklists", exact: true }).click();
  for (let n = 1; n <= 6; n++) {
    await page
      .getByRole("combobox", { name: "Parent", exact: true })
      .selectOption({ label: "Tractor" });
    await page.getByLabel("Checklist item").fill(`Check ${n}`);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      page.getByRole("cell", { name: `Check ${n}`, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Invites", exact: true }).click();
  await page.screenshot({ path: "test-results/c1-admin.png", fullPage: true });
  await page.getByRole("button", { name: "Create invite" }).click();
  const invite = page.locator("li strong").first();
  await expect(invite).toBeVisible();
  const code = await invite.innerText();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const tech = await context.newPage();
  await tech.goto("http://127.0.0.1:5173/join");
  await tech.getByLabel("Invite code").fill(code);
  await tech.getByLabel("Your name").fill("Kunle Bello");
  await tech.getByLabel("Username", { exact: true }).fill("kunle");
  await tech.getByLabel("Password").fill("local-browser-test-passphrase");
  await tech.getByRole("button", { name: "Continue" }).click();
  await expect(tech.getByRole("heading", { name: "Your team" })).toBeVisible();
  await expect(tech.getByText("Your account is ready.")).toBeVisible();
  await tech.screenshot({
    path: "test-results/c1-technician.png",
    fullPage: true,
  });
  expect(
    await tech.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await context.close();
  expect(external).toEqual([]);
});
