import { test, expect } from "@playwright/test";

test("app renders with project bar, palette, canvas, inspector, summary", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "New" })).toBeVisible();
  await expect(page.getByText("Miner", { exact: true })).toBeVisible();
  await expect(page.getByText("AWESOME Sink", { exact: true })).toBeVisible();
  await expect(page.getByText(/Power:/)).toBeVisible();
  await expect(page.getByText(/Points:/)).toBeVisible();
});

test("create project + add a miner via palette drop", async ({ page }) => {
  await page.goto("/");

  page.on("dialog", (d) => d.accept("Smoke Test Plant"));
  await page.getByRole("button", { name: "New" }).click();

  const palette = page.getByText("Miner", { exact: true });
  const canvas = page.locator(".react-flow__pane");
  await palette.dragTo(canvas);

  await expect(page.getByText("Miner MK1")).toBeVisible();
  await expect(page.getByText("/min")).toBeVisible();
});
