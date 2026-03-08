import { expect, test } from "@playwright/test";
import { createEntity } from "./helpers";

const FLOW_NAME = process.env.E2E_FLOW_NAME ?? "engineering";

test("activity feed shows Claude Code messages after entity creation", async ({ page }) => {
  // 1. Create entity via DEFCON REST API
  const entity = await createEntity(FLOW_NAME);
  expect(entity.id).toBeTruthy();

  // 2. Navigate to entity detail page
  // Retry navigation because entity may take a moment to be fetchable
  let retries = 3;
  while (retries > 0) {
    const response = await page.goto(`/entity/${entity.id}`);
    if (response && response.status() < 400) break;
    retries--;
    if (retries === 0) throw new Error(`Entity page /entity/${entity.id} returned error after retries`);
    await page.waitForTimeout(2000);
  }

  // 3. Verify page loaded — entity ID should appear somewhere on the page
  await expect(page.getByText(entity.id).first()).toBeVisible({ timeout: 10_000 });

  // 4. Verify "Agent Activity" section header exists
  await expect(page.getByText("Agent Activity").first()).toBeVisible();

  // 5. Wait for at least one activity row to appear
  // Activity rows contain one of: "▶ start", "⚙ tool", "✎ text", "✓ result"
  // The activity feed polls every 3s. Claude must claim and start sending messages.
  // This is the core assertion: we wait up to 150s for at least one activity row.
  const activityRow = page.locator("text=/[▶⚙✎✓]/").first();
  await expect(activityRow).toBeVisible({ timeout: 150_000 });

  // 6. Verify "No activity yet." is gone
  await expect(page.getByText("No activity yet.")).not.toBeVisible();
});
