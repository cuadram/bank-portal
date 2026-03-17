import { test, expect } from '@playwright/test';

/**
 * E2E Tests — US-604 Historial de cambios de configuración
 * SOFIA QA Agent · Sprint 7
 * Ejecutar: npx playwright test us604.spec.ts
 */

test.describe('US-604 - Historial de cambios de configuración', () => {

  const BASE = '/security/config-history';

  test('TC-604-01: Página config-history renderiza encabezado y selector de período', async ({ page }) => {
    await page.route('**/api/v1/security/config-history*', route =>
      route.fulfill({ status: 200, body: JSON.stringify({ entries: [], total: 0 }) }));
    await page.goto(BASE);
    await expect(page.getByRole('heading', { name: /historial de cambios/i })).toBeVisible();
    await expect(page.getByLabel(/seleccionar período/i)).toBeVisible();
  });

  test('TC-604-02: Historial vacío muestra mensaje "No hay cambios"', async ({ page }) => {
    await page.route('**/api/v1/security/config-history*', route =>
      route.fulfill({ status: 200, body: JSON.stringify({ entries: [], total: 0 }) }));
    await page.goto(BASE);
    await expect(page.getByText(/no hay cambios de configuración/i)).toBeVisible();
  });

  test('TC-604-03: Historial con eventos muestra lista con contador', async ({ page }) => {
    const entries = [
      { id: '1', eventType: 'TWO_FA_ENABLED', eventDescription: '2FA activado',
        occurredAt: '2026-03-10T10:00:00Z', ipSubnet: '192.168.1', unusualLocation: false },
      { id: '2', eventType: 'PREFERENCES_UPDATED', eventDescription: 'Prefs cambiadas',
        occurredAt: '2026-03-11T11:00:00Z', ipSubnet: '192.168.1', unusualLocation: false },
    ];
    await page.route('**/api/v1/security/config-history*', route =>
      route.fulfill({ status: 200, body: JSON.stringify({ entries, total: 2 }) }));
    await page.goto(BASE);
    await expect(page.getByText(/2 cambios encontrados/i)).toBeVisible();
    await expect(page.locator('.ch__list li')).toHaveCount(2);
  });

  test('TC-604-04: Evento unusualLocation=true muestra badge "Desde ubicación nueva"', async ({ page }) => {
    const entries = [{
      id: '3', eventType: 'PASSWORD_CHANGED', eventDescription: 'Contraseña cambiada',
      occurredAt: '2026-03-12T09:00:00Z', ipSubnet: '10.0.0', unusualLocation: true
    }];
    await page.route('**/api/v1/security/config-history*', route =>
      route.fulfill({ status: 200, body: JSON.stringify({ entries, total: 1 }) }));
    await page.goto(BASE);
    await expect(page.getByText(/desde ubicación nueva/i)).toBeVisible();
    await expect(page.locator('.ch__item--unusual')).toBeVisible();
  });

  test('TC-604-05: Cambio de período (30d → 60d) lanza nueva petición al backend', async ({ page }) => {
    const requests: string[] = [];
    await page.route('**/api/v1/security/config-history*', route => {
      requests.push(route.request().url());
      route.fulfill({ status: 200, body: JSON.stringify({ entries: [], total: 0 }) });
    });
    await page.goto(BASE);
    await page.getByLabel(/seleccionar período/i).selectOption('60');
    // Debe haberse lanzado 2 peticiones (inicial + cambio período)
    await page.waitForTimeout(300);
    expect(requests.length).toBeGreaterThanOrEqual(2);
  });

  test('TC-604-06: Aviso PCI-DSS "historial es inmutable" visible', async ({ page }) => {
    await page.route('**/api/v1/security/config-history*', route =>
      route.fulfill({ status: 200, body: JSON.stringify({ entries: [], total: 0 }) }));
    await page.goto(BASE);
    await expect(page.getByText(/inmutable/i)).toBeVisible();
    await expect(page.getByText(/PCI-DSS/i)).toBeVisible();
  });

  test('TC-604-07: Error de backend muestra mensaje de error (no pantalla en blanco)', async ({ page }) => {
    await page.route('**/api/v1/security/config-history*', route =>
      route.fulfill({ status: 500, body: '{}' }));
    await page.goto(BASE);
    await expect(page.getByText(/no se pudo cargar el historial/i)).toBeVisible();
  });

  test('TC-604-08: Spinner visible durante carga (response lenta)', async ({ page }) => {
    await page.route('**/api/v1/security/config-history*', route =>
      new Promise(r => setTimeout(() => {
        route.fulfill({ status: 200, body: JSON.stringify({ entries: [], total: 0 }) });
        r(undefined);
      }, 600)));
    await page.goto(BASE);
    await expect(page.locator('[aria-busy="true"]')).toBeVisible();
  });
});
