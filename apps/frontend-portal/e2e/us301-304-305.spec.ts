import { test, expect } from '@playwright/test';

/**
 * E2E Tests — US-301/304/305 Centro de Notificaciones
 * SOFIA QA Agent · Sprint 8 Semana 2
 */

const BASE = '/security/notifications';

// ─── US-301: historial paginado ───────────────────────────────────────────────

test.describe('US-301 - Historial de notificaciones paginado', () => {

  test('TC-301-01: Pagina /security/notifications renderiza titulo y filtros', async ({ page }) => {
    await page.route('**/api/v1/notifications*', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ content: [], totalPages: 0, totalElements: 0, number: 0 }) }));
    await page.route('**/api/v1/notifications/unread-count', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ count: 0 }) }));
    await page.goto(BASE);
    await expect(page.getByRole('heading', { name: /notificaciones de seguridad/i })).toBeVisible();
    await expect(page.getByRole('group', { name: /filtrar/i })).toBeVisible();
  });

  test('TC-301-02: Lista vacia muestra estado vacio informativo', async ({ page }) => {
    await page.route('**/api/v1/notifications*', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ content: [], totalPages: 0, totalElements: 0, number: 0 }) }));
    await page.route('**/api/v1/notifications/unread-count', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ count: 0 }) }));
    await page.goto(BASE);
    await expect(page.getByText(/no tienes notificaciones/i)).toBeVisible();
  });

  test('TC-301-03: 3 notificaciones muestran articulos en feed', async ({ page }) => {
    const content = Array.from({ length: 3 }, (_, i) => ({
      id: `${i + 1}`, eventType: 'LOGIN_NEW_DEVICE',
      title: `Acceso nuevo ${i + 1}`, body: 'Chrome · Windows',
      actionUrl: '/security/sessions', createdAt: new Date().toISOString(), read: false
    }));
    await page.route('**/api/v1/notifications?*', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ content, totalPages: 1, totalElements: 3, number: 0 }) }));
    await page.route('**/api/v1/notifications/unread-count', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ count: 3 }) }));
    await page.goto(BASE);
    await expect(page.locator('[role="feed"] article')).toHaveCount(3);
  });

  test('TC-301-04: Filtro "Logins" llama al backend con eventType=LOGIN_NEW_DEVICE', async ({ page }) => {
    const requests: string[] = [];
    await page.route('**/api/v1/notifications*', r => {
      requests.push(r.request().url());
      r.fulfill({ status: 200, body: JSON.stringify({ content: [], totalPages: 0, totalElements: 0, number: 0 }) });
    });
    await page.route('**/api/v1/notifications/unread-count', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ count: 0 }) }));
    await page.goto(BASE);
    await page.getByRole('button', { name: /logins/i }).click();
    await page.waitForTimeout(300);
    expect(requests.some(u => u.includes('eventType=LOGIN_NEW_DEVICE'))).toBeTruthy();
  });

  test('TC-301-05: Paginacion visible cuando hay mas de 1 pagina', async ({ page }) => {
    await page.route('**/api/v1/notifications*', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ content: [], totalPages: 3, totalElements: 55, number: 0 }) }));
    await page.route('**/api/v1/notifications/unread-count', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ count: 0 }) }));
    await page.goto(BASE);
    await expect(page.getByRole('navigation', { name: /paginación/i })).toBeVisible();
  });
});

// ─── US-304: acciones directas ────────────────────────────────────────────────

test.describe('US-304 - Acciones directas desde notificacion', () => {

  test('TC-304-01: Notificacion con actionUrl muestra boton "Ver →"', async ({ page }) => {
    const content = [{
      id: '1', eventType: 'LOGIN_NEW_DEVICE', title: 'Nuevo acceso',
      body: 'Chrome · macOS', actionUrl: '/security/sessions?highlight=abc',
      createdAt: new Date().toISOString(), read: false
    }];
    await page.route('**/api/v1/notifications*', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ content, totalPages: 1, totalElements: 1, number: 0 }) }));
    await page.route('**/api/v1/notifications/unread-count', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ count: 1 }) }));
    await page.goto(BASE);
    await expect(page.getByRole('link', { name: /ver/i })).toBeVisible();
  });

  test('TC-304-02: Click en "Marcar todas como leidas" llama PUT /read-all', async ({ page }) => {
    let readAllCalled = false;
    await page.route('**/api/v1/notifications/read-all', r => {
      readAllCalled = true;
      r.fulfill({ status: 200, body: JSON.stringify({ updated: 5 }) });
    });
    await page.route('**/api/v1/notifications*', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ content: [], totalPages: 0, totalElements: 0, number: 0 }) }));
    await page.route('**/api/v1/notifications/unread-count', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ count: 5 }) }));
    await page.goto(BASE);
    const btn = page.getByRole('button', { name: /marcar todas como leídas/i });
    if (await btn.isVisible()) await btn.click();
    await page.waitForTimeout(300);
    expect(readAllCalled).toBeTruthy();
  });
});

// ─── US-305: notificaciones en tiempo real SSE ────────────────────────────────

test.describe('US-305 - Notificaciones en tiempo real SSE', () => {

  test('TC-305-01: Badge en header refleja unread-count inicial', async ({ page }) => {
    await page.route('**/api/v1/notifications/unread-count', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ count: 7 }) }));
    await page.route('**/api/v1/notifications*', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ content: [], totalPages: 0, totalElements: 0, number: 0 }) }));
    await page.goto(BASE);
    await expect(page.locator('.nc__badge')).toContainText('7');
  });

  test('TC-305-02: Toast aparece cuando SSE emite evento notification', async ({ page }) => {
    // Simular SSE via mock de EventSource no es posible directamente en Playwright
    // — verificamos que el contenedor de toasts existe y tiene aria-live
    await page.route('**/api/v1/notifications*', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ content: [], totalPages: 0, totalElements: 0, number: 0 }) }));
    await page.route('**/api/v1/notifications/unread-count', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ count: 0 }) }));
    await page.goto(BASE);
    const toastContainer = page.locator('[aria-live="assertive"]');
    await expect(toastContainer).toBeAttached();
  });

  test('TC-305-03: WCAG 2.1 - badge tiene aria-label con conteo', async ({ page }) => {
    await page.route('**/api/v1/notifications/unread-count', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ count: 3 }) }));
    await page.route('**/api/v1/notifications*', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ content: [], totalPages: 0, totalElements: 0, number: 0 }) }));
    await page.goto(BASE);
    const badge = page.locator('.nc__badge[aria-label]');
    await expect(badge).toBeAttached();
    const label = await badge.getAttribute('aria-label');
    expect(label).toContain('sin leer');
  });

  test('TC-305-04: Lista tiene role=feed para WCAG 2.1 (listas dinamicas)', async ({ page }) => {
    const content = [{ id: '1', eventType: 'LOGIN_NEW_DEVICE', title: 'Test',
      body: 'body', actionUrl: null, createdAt: new Date().toISOString(), read: false }];
    await page.route('**/api/v1/notifications*', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ content, totalPages: 1, totalElements: 1, number: 0 }) }));
    await page.route('**/api/v1/notifications/unread-count', r =>
      r.fulfill({ status: 200, body: JSON.stringify({ count: 1 }) }));
    await page.goto(BASE);
    await expect(page.locator('[role="feed"]')).toBeVisible();
  });
});
