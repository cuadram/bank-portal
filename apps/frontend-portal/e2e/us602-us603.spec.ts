import { test, expect } from '@playwright/test';

/**
 * E2E Tests — US-602 Desbloqueo por email + US-603 Login contextual
 * SOFIA QA Agent · Sprint 7 Semana 2
 */

// ─── US-602 ───────────────────────────────────────────────────────────────────

test.describe('US-602 - Desbloqueo de cuenta por email', () => {

  test('TC-602-01: Pantalla /account-locked muestra formulario', async ({ page }) => {
    await page.goto('/account-locked');
    await expect(page.getByRole('heading', { name: /cuenta bloqueada/i })).toBeVisible();
    await expect(page.getByLabel(/correo electrónico/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /solicitar desbloqueo/i })).toBeVisible();
  });

  test('TC-602-02: Envio valido muestra confirmacion (204 backend)', async ({ page }) => {
    await page.route('**/api/v1/account/unlock', route => route.fulfill({ status: 204 }));
    await page.goto('/account-locked');
    await page.getByLabel(/correo electrónico/i).fill('user@test.com');
    await page.getByRole('button', { name: /solicitar desbloqueo/i }).click();
    await expect(page.getByText(/si el correo existe.*recibirás/i)).toBeVisible();
  });

  test('TC-602-03: Email invalido muestra error de validacion frontend', async ({ page }) => {
    await page.goto('/account-locked');
    await page.getByLabel(/correo electrónico/i).fill('notanemail');
    await page.getByRole('button', { name: /solicitar desbloqueo/i }).click();
    await expect(page.getByText(/introduce un email válido/i)).toBeVisible();
  });

  test('TC-602-04: Deep-link unlock redirige a /login?reason=account-unlocked', async ({ page }) => {
    await page.route('**/api/v1/account/unlock/valid-token', route =>
      route.fulfill({ status: 302, headers: { location: '/login?reason=account-unlocked' } }));
    await page.goto('/api/v1/account/unlock/valid-token');
    await expect(page).toHaveURL(/reason=account-unlocked/);
  });

  test('TC-602-05: Banner exito en /login?reason=account-unlocked', async ({ page }) => {
    await page.goto('/login?reason=account-unlocked');
    await expect(page.getByText(/cuenta desbloqueada correctamente/i)).toBeVisible();
  });
});

// ─── US-603 ───────────────────────────────────────────────────────────────────

test.describe('US-603 - Confirmacion de contexto de red', () => {

  test('TC-603-01: Deep-link /auth/confirm-context muestra estado Confirmando', async ({ page }) => {
    await page.route('**/api/v1/auth/confirm-context', route =>
      new Promise(r => setTimeout(() => { route.fulfill({ status: 204 }); r(undefined); }, 500)));
    await page.goto('/auth/confirm-context?token=valid-token');
    await expect(page.getByText(/confirmando acceso/i)).toBeVisible();
  });

  test('TC-603-02: 204 -> state success + redirect /login?reason=context-confirmed', async ({ page }) => {
    await page.route('**/api/v1/auth/confirm-context', route => route.fulfill({ status: 204 }));
    await page.goto('/auth/confirm-context?token=valid-token');
    await expect(page.getByRole('heading', { name: /acceso confirmado/i })).toBeVisible({ timeout: 3000 });
    await page.waitForURL(/reason=context-confirmed/, { timeout: 5000 });
  });

  test('TC-603-03: 400 expirado -> heading Enlace expirado + boton login', async ({ page }) => {
    await page.route('**/api/v1/auth/confirm-context', route =>
      route.fulfill({ status: 400, body: JSON.stringify({ message: 'Token expirado' }) }));
    await page.goto('/auth/confirm-context?token=expired-token');
    await expect(page.getByRole('heading', { name: /enlace expirado/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /inicio de sesión/i })).toBeVisible();
  });

  test('TC-603-04: 400 ya utilizado -> heading Ya utilizado', async ({ page }) => {
    await page.route('**/api/v1/auth/confirm-context', route =>
      route.fulfill({ status: 400, body: JSON.stringify({ message: 'Token ya utilizado' }) }));
    await page.goto('/auth/confirm-context?token=used-token');
    await expect(page.getByRole('heading', { name: /ya utilizado/i })).toBeVisible();
  });

  test('TC-603-05: Sin token en URL -> error generico', async ({ page }) => {
    await page.goto('/auth/confirm-context');
    await expect(page.getByRole('heading', { name: /error al confirmar/i })).toBeVisible();
  });

  test('TC-603-06: WCAG 2.1 - aria-live presente en pagina confirm-context', async ({ page }) => {
    await page.goto('/auth/confirm-context?token=any');
    const liveRegion = page.locator('[aria-live]');
    await expect(liveRegion).toBeAttached();
  });
});
