import { test, expect } from '@playwright/test';

test.describe('Diagnose save on Acme Corp Project 46 (activity 161)', () => {
    test('edit and save existing activity', async ({ page }) => {
        const consoleErrors: string[] = [];
        const networkRequests: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });
        page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));
        page.on('request', (req) => {
            if (req.url().includes('/dashboard/activity') || req.method() === 'POST') {
                networkRequests.push(`${req.method()} ${req.url()}`);
            }
        });

        // Login
        await page.goto('/login');
        await page.getByLabel('Email Address').fill('admin@example.com');
        await page.getByRole('button', { name: 'Sign in' }).click();
        await page.waitForURL('/dashboard');

        // Go to edit page for activity 161
        await page.goto('/dashboard/activity/161');
        const saveBtn = page.getByRole('button', { name: /Save Activity/i });
        await expect(saveBtn).toBeVisible({ timeout: 15000 });

        // Check button HTML attributes
        const btnHtml = await saveBtn.evaluate((el) => el.outerHTML);
        console.log('=== BUTTON HTML ===');
        console.log(btnHtml);

        // Check if form element exists with id
        const formEl = await page.locator('#activity-form').count();
        console.log('Form #activity-form count:', formEl);

        console.log('=== BEFORE SAVE ===');
        console.log('URL:', page.url());
        console.log('Save disabled?', await saveBtn.isDisabled());

        // Click Save
        await saveBtn.click();

        // Wait for navigation to /dashboard with generous timeout
        try {
            await page.waitForURL('**/dashboard', { timeout: 15000, waitUntil: 'domcontentloaded' });
            console.log('=== SAVE SUCCEEDED - navigated to /dashboard ===');
            console.log('URL:', page.url());
        } catch (e) {
            console.log('=== SAVE FAILED - did NOT navigate to /dashboard ===');
            console.log('URL:', page.url());
            await page.screenshot({ path: 'test-results/diag-save-failed.png', fullPage: false });

            // Check for version confirm modal
            const modalVisible = await page.locator('[role="dialog"]').count();
            console.log('Dialog/modal count:', modalVisible);
            if (modalVisible > 0) {
                const modalText = await page.locator('[role="dialog"]').allTextContents();
                console.log('Modal text:', JSON.stringify(modalText));
            }
        }

        // Screenshot
        await page.screenshot({ path: 'test-results/diag-save-after-click.png', fullPage: false });

        // Check for version confirm modal
        const modalVisible = await page.locator('[role="dialog"]').count();
        console.log('Dialog/modal count:', modalVisible);
        if (modalVisible > 0) {
            const modalText = await page.locator('[role="dialog"]').allTextContents();
            console.log('Modal text:', JSON.stringify(modalText));
        }

        // Capture any visible toast text
        const toasts = await page.locator('[data-sonner-toast], [role="status"], .toast').allTextContents().catch(() => []);
        console.log('Toasts:', JSON.stringify(toasts));

        // Capture inline error text
        const inlineErr = await page.locator('.text-destructive').allTextContents().catch(() => []);
        console.log('Inline errors:', JSON.stringify(inlineErr));

        console.log('Console errors:', JSON.stringify(consoleErrors, null, 2));
        console.log('Network requests:', JSON.stringify(networkRequests, null, 2));

        const navigatedToDashboard = page.url().endsWith('/dashboard');
        console.log('SAVE SUCCEEDED (navigated to /dashboard)?', navigatedToDashboard);
    });
});
