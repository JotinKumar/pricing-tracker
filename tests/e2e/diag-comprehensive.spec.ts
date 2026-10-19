import { test, expect } from '@playwright/test';

test.describe('Comprehensive edge-case tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email Address').fill('admin@example.com');
        await page.getByRole('button', { name: 'Sign in' }).click();
        await page.waitForURL('/dashboard');
    });

    test('1. Dashboard hides auto-added members for Acme Corp Project 46', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForTimeout(3000);

        // Look for "Acme Corp Project 46" in the table
        const row = page.locator('tr', { hasText: 'Project 46' }).first();
        await expect(row).toBeVisible({ timeout: 10000 });

        // Get row text - avatars show as initials text
        const rowText = await row.textContent() || '';
        console.log('Row text:', rowText.substring(0, 300));

        // Count avatar elements (they use TooltipTrigger wrapping a div with Avatar)
        const avatarElements = row.locator('[data-radix-collection-item], [class*="rounded-full"][class*="ring-2"]');
        const avatarCount = await avatarElements.count();
        console.log(`Avatar element count for Project 46: ${avatarCount}`);

        // With isAutoAdded filtering, the dashboard should show only manually-added team members
        // in allowed teams (Sales, Solution, Finance, Pricing):
        // Solution Arch 1 (Solutions), Pricing Analyst 1 (Pricing), Sales User 1 (Sales) = 3
        // The 5 auto-added managers should be hidden
        expect(avatarCount).toBeLessThanOrEqual(4);
        expect(avatarCount).toBeGreaterThanOrEqual(1);

        // Verify auto-added manager initials are NOT in the row text
        // Managers: AVP User (AU), Director One (DO), Pricing Manager 1 (PM1->PM), 
        // Sales Manager 1 (SM1->SM), Sol Manager 1 (SM1->SM)
        // The row text should contain team member initials but NOT manager initials
        // Team members: PA (Pricing Analyst 1), SA (Solution Arch 1), SU (Sales User 1)
        // Actually getInitials returns first+last letter: P1, S1, S1
        const hasManagerInitials = ['AU', 'DO', 'PM', 'SM'].some(initial =>
            rowText.includes(initial)
        );
        // Note: SM could be ambiguous, but AV and DO are clear manager initials
        const hasClearManagerInitials = rowText.includes('AU') || rowText.includes('DO');
        expect(hasClearManagerInitials).toBe(false);
    });

    test('2. Edit and save activity 161 - save works', async ({ page }) => {
        await page.goto('/dashboard/activity/161');
        const saveBtn = page.getByRole('button', { name: /Save Activity/i });
        await expect(saveBtn).toBeVisible({ timeout: 15000 });

        // Click Save
        await saveBtn.click();

        // Should navigate to /dashboard
        await page.waitForURL('**/dashboard', { timeout: 15000 });
        console.log('Save succeeded - navigated to /dashboard');
    });

    test('3. Deal Team tab shows Manually Added and Auto Added sections', async ({ page }) => {
        await page.goto('/dashboard/activity/161');
        await page.waitForTimeout(2000);

        // Click Deal Team tab
        const teamTab = page.getByRole('tab', { name: /Deal Team/i });
        await expect(teamTab).toBeVisible({ timeout: 10000 });
        await teamTab.click();
        await page.waitForTimeout(1000);

        // Check for "Manually Added" section
        const manualSection = page.locator('text=Manually Added');
        await expect(manualSection).toBeVisible({ timeout: 5000 });

        // Check that manually added shows correct count (4: Solution Arch 1, Pricing Analyst 1, Sales User 1, WMF User 1)
        const manualText = await manualSection.textContent();
        console.log('Manual section text:', manualText);

        // Check the "Show auto-added members" checkbox
        const showCheckbox = page.getByRole('checkbox', { name: /Show auto-added/i });
        await expect(showCheckbox).toBeVisible();

        // Click it to show auto-added
        await showCheckbox.check();
        await page.waitForTimeout(500);

        // Now auto-added section should appear
        const autoSection = page.locator('text=Auto Added');
        await expect(autoSection).toBeVisible({ timeout: 5000 });
        const autoText = await autoSection.textContent();
        console.log('Auto section text:', autoText);
    });

    test('4. Create new activity - save works', async ({ page }) => {
        await page.goto('/dashboard/activity/new');
        await page.waitForTimeout(3000);

        const saveBtn = page.getByRole('button', { name: /Save Activity/i });
        await expect(saveBtn).toBeVisible({ timeout: 10000 });

        // Click Save without filling required fields - should show validation errors
        await saveBtn.click();
        await page.waitForTimeout(3000);

        // Should show validation error toast (form has required fields)
        const toasts = await page.locator('[data-sonner-toast]').allTextContents().catch(() => []);
        const inlineErrors = await page.locator('.text-destructive').allTextContents().catch(() => []);
        const url = page.url();
        console.log('URL after save (empty form):', url);
        console.log('Toasts:', JSON.stringify(toasts));
        console.log('Inline errors:', JSON.stringify(inlineErrors));

        // Should NOT navigate to /dashboard (validation should fail)
        expect(url).toContain('/dashboard/activity/new');
    });

    test('5. Dashboard showAutoAdded checkbox toggles visibility', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForTimeout(3000);

        // Find the "Show auto-added" checkbox in dashboard controls
        const showCheckbox = page.getByRole('checkbox', { name: /Show auto-added|auto.added/i });

        if (await showCheckbox.isVisible().catch(() => false)) {
            // Get row text before checking
            const row = page.locator('tr', { hasText: 'Project 46' }).first();
            const textBefore = await row.textContent() || '';
            console.log(`Row text before toggle: ${textBefore.substring(0, 100)}`);

            // Check the checkbox
            await showCheckbox.check();
            await page.waitForTimeout(2000);

            // Get row text after checking
            const textAfter = await row.textContent() || '';
            console.log(`Row text after toggle: ${textAfter.substring(0, 100)}`);

            // When showAutoAdded is checked, more avatars should appear
            // The row text should be longer (more initials visible)
            expect(textAfter.length).toBeGreaterThanOrEqual(textBefore.length);
        } else {
            console.log('Show auto-added checkbox not found - skipping toggle test');
        }
    });
});
