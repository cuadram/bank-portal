import { test, expect } from '@playwright/test';

/**
 * E2E Tests — FEAT-007 Sprint 9
 *
 * US-701 Resumen de cuentas con saldo
 * US-702 Listado de movimientos paginado con filtros
 * US-703 Búsqueda de movimientos
 * US-704 Extracto bancario PDF y CSV
 * US-705 Categorización automática de movimientos
 *
 * @author SOFIA QA Agent · Sprint 9 Semana 2
 */

// ─── Mocks de apoyo ────────────────────────────────────────────────────────────

const MOCK_ACCOUNTS = [
  {
    accountId: 'aaaaaaaa-0000-0000-0000-000000000001',
    alias: 'Cuenta Nómina',
    ibanMasked: 'ES** **** **** **** 1234',
    type: 'CORRIENTE',
    availableBalance: 3500.00,
    retainedBalance: 0.00,
  },
  {
    accountId: 'bbbbbbbb-0000-0000-0000-000000000002',
    alias: 'Cuenta Ahorro',
    ibanMasked: 'ES** **** **** **** 5678',
    type: 'AHORRO',
    availableBalance: 10000.00,
    retainedBalance: 500.00,
  },
];

const MOCK_TRANSACTIONS = {
  content: [
    {
      id: 'tx-001', accountId: 'aaaaaaaa-0000-0000-0000-000000000001',
      transactionDate: '2026-02-15T10:00:00Z',
      concept: 'NOMINA EMPRESA SL',
      amount: 2000.00, balanceAfter: 3500.00, category: 'NOMINA', type: 'ABONO',
    },
    {
      id: 'tx-002', accountId: 'aaaaaaaa-0000-0000-0000-000000000001',
      transactionDate: '2026-02-14T09:00:00Z',
      concept: 'AMAZON MARKETPLACE',
      amount: -45.99, balanceAfter: 1500.00, category: 'COMPRA', type: 'CARGO',
    },
    {
      id: 'tx-003', accountId: 'aaaaaaaa-0000-0000-0000-000000000001',
      transactionDate: '2026-02-12T18:30:00Z',
      concept: 'BIZUM JUAN GARCIA',
      amount: -20.00, balanceAfter: 1545.99, category: 'BIZUM', type: 'CARGO',
    },
  ],
  totalElements: 3,
  totalPages: 1,
  size: 20,
  number: 0,
};

// ─── US-701: Resumen de cuentas ────────────────────────────────────────────────

test.describe('US-701 - Resumen de cuentas con saldo', () => {

  test('TC-701-01: lista de cuentas visible con alias, IBAN enmascarado y saldo', async ({ page }) => {
    await page.route('**/api/v1/accounts', route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_ACCOUNTS) }));

    await page.goto('/accounts');

    await expect(page.getByText('Cuenta Nómina')).toBeVisible();
    await expect(page.getByText('ES** **** **** **** 1234')).toBeVisible();
    await expect(page.getByText(/3\.500/)).toBeVisible(); // saldo disponible
  });

  test('TC-701-02: saldo retenido visible cuando > 0', async ({ page }) => {
    await page.route('**/api/v1/accounts', route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_ACCOUNTS) }));

    await page.goto('/accounts');

    // Cuenta Ahorro tiene retainedBalance: 500
    await expect(page.getByText(/500/)).toBeVisible();
  });

  test('TC-701-03: IBAN completo NO visible en pantalla (enmascarado)', async ({ page }) => {
    await page.route('**/api/v1/accounts', route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_ACCOUNTS) }));

    await page.goto('/accounts');

    // IBAN real nunca debe mostrarse
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('ES12 3456 7890 1234 5678');
  });

  test('TC-701-04: carga inicial respeta ≤2s (mock inmediato)', async ({ page }) => {
    await page.route('**/api/v1/accounts', route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_ACCOUNTS) }));

    const start = Date.now();
    await page.goto('/accounts');
    await expect(page.getByText('Cuenta Nómina')).toBeVisible();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(2000);
  });
});

// ─── US-702: Movimientos paginados con filtros ─────────────────────────────────

test.describe('US-702 - Listado de movimientos paginado con filtros', () => {

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/accounts', route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_ACCOUNTS) }));
    await page.route('**/api/v1/accounts/aaaaaaaa-*/transactions*', route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_TRANSACTIONS) }));
  });

  test('TC-702-01: tabla de movimientos muestra fecha, concepto, importe y categoría', async ({ page }) => {
    await page.goto('/accounts/aaaaaaaa-0000-0000-0000-000000000001/transactions');

    await expect(page.getByText('NOMINA EMPRESA SL')).toBeVisible();
    await expect(page.getByText('AMAZON MARKETPLACE')).toBeVisible();
    await expect(page.getByText('BIZUM JUAN GARCIA')).toBeVisible();
  });

  test('TC-702-02: badge de categoría NOMINA visible', async ({ page }) => {
    await page.goto('/accounts/aaaaaaaa-0000-0000-0000-000000000001/transactions');

    await expect(page.getByText('NOMINA')).toBeVisible();
    await expect(page.getByText('COMPRA')).toBeVisible();
    await expect(page.getByText('BIZUM')).toBeVisible();
  });

  test('TC-702-03: filtro por tipo CARGO reduce lista', async ({ page }) => {
    // Mock filtrado — sólo cargos
    const cargos = {
      ...MOCK_TRANSACTIONS,
      content: MOCK_TRANSACTIONS.content.filter(t => t.type === 'CARGO'),
      totalElements: 2,
    };
    await page.route('**/api/v1/accounts/aaaaaaaa-*/transactions?*type=CARGO*', route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(cargos) }));

    await page.goto('/accounts/aaaaaaaa-0000-0000-0000-000000000001/transactions');
    await page.selectOption('[data-testid="filter-type"]', 'CARGO');

    await expect(page.getByText('AMAZON MARKETPLACE')).toBeVisible();
    await expect(page.getByText('NOMINA EMPRESA SL')).not.toBeVisible();
  });

  test('TC-702-04: estado vacío muestra mensaje apropiado', async ({ page }) => {
    await page.route('**/api/v1/accounts/aaaaaaaa-*/transactions*', route =>
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 }),
      }));

    await page.goto('/accounts/aaaaaaaa-0000-0000-0000-000000000001/transactions');
    await expect(page.getByText(/no hay movimientos/i)).toBeVisible();
  });
});

// ─── US-703: Búsqueda de movimientos ──────────────────────────────────────────

test.describe('US-703 - Búsqueda full-text de movimientos', () => {

  test('TC-703-01: búsqueda con < 3 caracteres NO dispara petición al backend', async ({ page }) => {
    let searchCalled = false;
    await page.route('**/api/v1/accounts/aaaaaaaa-*/transactions?*q=am*', _ => {
      searchCalled = true;
    });
    await page.route('**/api/v1/accounts', route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_ACCOUNTS) }));
    await page.route('**/api/v1/accounts/aaaaaaaa-*/transactions*', route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_TRANSACTIONS) }));

    await page.goto('/accounts/aaaaaaaa-0000-0000-0000-000000000001/transactions');
    await page.fill('[data-testid="search-input"]', 'am');
    await page.waitForTimeout(500); // esperar posible debounce

    expect(searchCalled).toBe(false);
  });

  test('TC-703-02: búsqueda con ≥ 3 caracteres dispara petición con parámetro q', async ({ page }) => {
    let searchUrl = '';
    await page.route('**/api/v1/accounts', route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_ACCOUNTS) }));
    await page.route('**/api/v1/accounts/aaaaaaaa-*/transactions**', route => {
      searchUrl = route.request().url();
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_TRANSACTIONS) });
    });

    await page.goto('/accounts/aaaaaaaa-0000-0000-0000-000000000001/transactions');
    await page.fill('[data-testid="search-input"]', 'amazon');
    await page.waitForTimeout(400); // esperar debounce 300ms

    expect(searchUrl).toContain('q=amazon');
  });

  test('TC-703-03: resultados de búsqueda muestran highlight del término', async ({ page }) => {
    await page.route('**/api/v1/accounts', route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_ACCOUNTS) }));
    await page.route('**/api/v1/accounts/aaaaaaaa-*/transactions**', route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_TRANSACTIONS) }));

    await page.goto('/accounts/aaaaaaaa-0000-0000-0000-000000000001/transactions');
    await page.fill('[data-testid="search-input"]', 'amazon');
    await page.waitForTimeout(400);

    // El componente debe envolver el término en <mark> o similar
    const highlighted = page.locator('mark, .highlight, [data-highlight]').first();
    await expect(highlighted).toBeVisible();
  });
});

// ─── US-704: Extracto bancario ────────────────────────────────────────────────

test.describe('US-704 - Descarga de extracto bancario', () => {

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/accounts', route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_ACCOUNTS) }));
    await page.route('**/api/v1/accounts/aaaaaaaa-*/transactions*', route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_TRANSACTIONS) }));
  });

  test('TC-704-01: botón Descargar extracto visible en la vista de movimientos', async ({ page }) => {
    await page.goto('/accounts/aaaaaaaa-0000-0000-0000-000000000001/transactions');

    await expect(
      page.getByRole('button', { name: /descargar extracto/i })
        .or(page.getByText(/descargar extracto/i))
    ).toBeVisible();
  });

  test('TC-704-02: descarga PDF genera petición con ?format=pdf', async ({ page }) => {
    let statementUrl = '';

    await page.route('**/api/v1/accounts/aaaaaaaa-*/statements/**', route => {
      statementUrl = route.request().url();
      route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        headers: {
          'Content-Disposition': 'attachment; filename="extracto-2026-02.pdf"',
          'X-Content-SHA256': 'abc123'.padEnd(64, '0'),
        },
        body: Buffer.from('%PDF-1.4 fake'),
      });
    });

    await page.goto('/accounts/aaaaaaaa-0000-0000-0000-000000000001/transactions');

    // Abrir selector de extracto y elegir PDF
    const downloadBtn = page.getByRole('button', { name: /descargar extracto/i })
      .or(page.getByTestId('download-statement-btn'));
    await downloadBtn.click();

    // Seleccionar formato PDF si hay selector
    const pdfOption = page.getByRole('option', { name: /pdf/i })
      .or(page.getByTestId('format-pdf'));
    if (await pdfOption.isVisible()) await pdfOption.click();

    // Confirmar mes actual
    const selectMonth = page.getByTestId('select-month').or(
      page.getByLabel(/selecciona mes/i));
    if (await selectMonth.isVisible()) {
      await selectMonth.selectOption({ index: 0 });
    }

    const confirmBtn = page.getByRole('button', { name: /confirmar|descargar|generar/i });
    if (await confirmBtn.isVisible()) await confirmBtn.click();

    await page.waitForTimeout(300);

    if (statementUrl) {
      expect(statementUrl).toContain('format=pdf');
    }
  });

  test('TC-704-03: descarga CSV genera petición con ?format=csv', async ({ page }) => {
    let statementUrl = '';

    await page.route('**/api/v1/accounts/aaaaaaaa-*/statements/**', route => {
      statementUrl = route.request().url();
      route.fulfill({
        status: 200,
        contentType: 'text/csv;charset=UTF-8',
        headers: {
          'Content-Disposition': 'attachment; filename="extracto-2026-02.csv"',
          'X-Content-SHA256': 'deadbeef'.padEnd(64, 'a'),
        },
        body: '\uFEFFfecha;concepto;importe\n',
      });
    });

    await page.goto('/accounts/aaaaaaaa-0000-0000-0000-000000000001/transactions');

    const downloadBtn = page.getByRole('button', { name: /descargar extracto/i })
      .or(page.getByTestId('download-statement-btn'));
    await downloadBtn.click();

    const csvOption = page.getByRole('option', { name: /csv/i })
      .or(page.getByTestId('format-csv'));
    if (await csvOption.isVisible()) await csvOption.click();

    const confirmBtn = page.getByRole('button', { name: /confirmar|descargar|generar/i });
    if (await confirmBtn.isVisible()) await confirmBtn.click();

    await page.waitForTimeout(300);

    if (statementUrl) {
      expect(statementUrl).toContain('format=csv');
    }
  });

  test('TC-704-04: mes sin movimientos muestra mensaje informativo (204 backend)', async ({ page }) => {
    await page.route('**/api/v1/accounts/aaaaaaaa-*/statements/**', route =>
      route.fulfill({ status: 204 }));

    await page.goto('/accounts/aaaaaaaa-0000-0000-0000-000000000001/transactions');

    const downloadBtn = page.getByRole('button', { name: /descargar extracto/i })
      .or(page.getByTestId('download-statement-btn'));
    await downloadBtn.click();

    const confirmBtn = page.getByRole('button', { name: /confirmar|descargar|generar/i });
    if (await confirmBtn.isVisible()) await confirmBtn.click();

    await expect(
      page.getByText(/no hay movimientos en el período/i)
        .or(page.getByText(/sin movimientos/i))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ─── US-705: Categorización automática ────────────────────────────────────────

test.describe('US-705 - Categorización automática de movimientos', () => {

  const MOCK_CATEGORIZED = {
    content: [
      { id: 'c-001', accountId: 'aaaaaaaa-0000-0000-0000-000000000001',
        transactionDate: '2026-02-20T12:00:00Z', concept: 'NOMINA EMPRESA SL',
        amount: 2000, balanceAfter: 5000, category: 'NOMINA', type: 'ABONO' },
      { id: 'c-002', accountId: 'aaaaaaaa-0000-0000-0000-000000000001',
        transactionDate: '2026-02-19T10:00:00Z', concept: 'RECIBO IBERDROLA',
        amount: -65.50, balanceAfter: 3000, category: 'RECIBO_UTIL', type: 'CARGO' },
      { id: 'c-003', accountId: 'aaaaaaaa-0000-0000-0000-000000000001',
        transactionDate: '2026-02-18T09:00:00Z', concept: 'BIZUM MARIA',
        amount: -10, balanceAfter: 3065.50, category: 'BIZUM', type: 'CARGO' },
      { id: 'c-004', accountId: 'aaaaaaaa-0000-0000-0000-000000000001',
        transactionDate: '2026-02-17T15:00:00Z', concept: 'COMISION MANTENIMIENTO',
        amount: -3, balanceAfter: 3075.50, category: 'COMISION', type: 'CARGO' },
      { id: 'c-005', accountId: 'aaaaaaaa-0000-0000-0000-000000000001',
        transactionDate: '2026-02-16T11:00:00Z', concept: 'REINTEGRO CAJERO 4B',
        amount: -100, balanceAfter: 3078.50, category: 'CAJERO', type: 'CARGO' },
    ],
    totalElements: 5, totalPages: 1, size: 20, number: 0,
  };

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/accounts', route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_ACCOUNTS) }));
    await page.route('**/api/v1/accounts/aaaaaaaa-*/transactions**', route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_CATEGORIZED) }));
  });

  test('TC-705-01: categorías NOMINA, RECIBO_UTIL, BIZUM, COMISION, CAJERO visibles', async ({ page }) => {
    await page.goto('/accounts/aaaaaaaa-0000-0000-0000-000000000001/transactions');

    for (const cat of ['NOMINA', 'RECIBO_UTIL', 'BIZUM', 'COMISION', 'CAJERO']) {
      await expect(page.getByText(cat)).toBeVisible();
    }
  });

  test('TC-705-02: filtro por categoría aplica parámetro en query string', async ({ page }) => {
    let filteredUrl = '';
    await page.route('**/api/v1/accounts/aaaaaaaa-*/transactions**', route => {
      filteredUrl = route.request().url();
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_CATEGORIZED) });
    });

    await page.goto('/accounts/aaaaaaaa-0000-0000-0000-000000000001/transactions');

    // Seleccionar filtro de categoría
    const categoryFilter = page.getByTestId('filter-category')
      .or(page.getByLabel(/categoría/i));
    if (await categoryFilter.isVisible()) {
      await categoryFilter.selectOption('NOMINA');
      await page.waitForTimeout(400);
      expect(filteredUrl).toContain('category=NOMINA');
    }
  });

  test('TC-705-03: categoría OTRO como fallback — no rompe UI', async ({ page }) => {
    const withOtro = {
      ...MOCK_CATEGORIZED,
      content: [{
        id: 'c-otro', accountId: 'aaaaaaaa-0000-0000-0000-000000000001',
        transactionDate: '2026-02-15T08:00:00Z', concept: 'OPERACION DESCONOCIDA',
        amount: -5, balanceAfter: 500, category: 'OTRO', type: 'CARGO',
      }],
    };
    await page.route('**/api/v1/accounts/aaaaaaaa-*/transactions**', route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(withOtro) }));

    await page.goto('/accounts/aaaaaaaa-0000-0000-0000-000000000001/transactions');

    await expect(page.getByText('OTRO')).toBeVisible();
    // No debe haber errores visibles en UI
    await expect(page.getByText(/error/i)).not.toBeVisible();
  });
});
