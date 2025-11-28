import { test, expect } from '@playwright/test';
import { HOME_SCREEN_STRINGS } from '@/constants/strings/home';

test.describe('Home screen timer', () => {
  test.beforeEach(async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();
  });

  test('reflects default values and supports adjustments', async ({ page }) => {
    const { headerTitle, actions } = HOME_SCREEN_STRINGS;
    await expect(page.getByTestId('home-header-title')).toHaveText(headerTitle);

    const hoursValue = page.getByTestId('hours-value');
    const minutesValue = page.getByTestId('minutes-value');
    const incrementHoursButton = page.getByTestId('increment-hours');
    const decrementHoursButton = page.getByTestId('decrement-hours');
    const incrementMinutesButton = page.getByTestId('increment-minutes');
    const decrementMinutesButton = page.getByTestId('decrement-minutes');
    const recommendButton = page.getByTestId('recommend-button');

    await expect(hoursValue).toHaveText('00');
    await expect(minutesValue).toHaveText('20');

    await incrementHoursButton.click();
    await expect(hoursValue).toHaveText('01');

    await incrementMinutesButton.click();
    await incrementMinutesButton.click();
    await expect(minutesValue).toHaveText('22');

    await decrementHoursButton.click();
    await expect(hoursValue).toHaveText('00');

    await decrementMinutesButton.click();
    await expect(minutesValue).toHaveText('21');

    await expect(recommendButton).toContainText(actions.recommendButton);

    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    await recommendButton.click();
    await expect(recommendButton).toBeVisible();
    await expect.poll(
      () => consoleLogs.some((log) => log.includes(actions.recommendLog)),
    ).toBeTruthy();
  });
});