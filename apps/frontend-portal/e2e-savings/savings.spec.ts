import { test, expect, request } from '@playwright/test';

/**
 * E2E API-driven · FEAT-024 Sprint 26
 * Cubre: US-024-01..09 (con foco en flujos completos críticos)
 */
const BASE = 'http://localhost:8081';

async function devToken(api: any, email: string): Promise<string> {
  const r = await api.get(BASE + '/dev/token?email=' + encodeURIComponent(email));
  expect(r.status()).toBe(200);
  const j = await r.json();
  return j.accessToken;
}

test.describe('FEAT-024 — Savings Goals API-driven E2E', () => {
  let token: string;
  test.beforeAll(async () => {
    const api = await request.newContext();
    token = await devToken(api, 'a.delacuadra@nemtec.es');
  });

  test('TC-E2E-001 · flujo completo: crear -> aportar -> hito -> cerrar', async ({ request }) => {
    const create = await request.post(BASE + '/api/v1/savings/goals', {
      headers: { Authorization: 'Bearer ' + token },
      data: { name: 'E2E Goal Flow ' + Date.now(), targetAmount: 200, targetDate: '2027-12-31', category: 'OTROS', icon: 'piggy-bank', color: '#10B981', sourceAccountId: 'acc00000-0000-0000-0000-000000000001' }
    });
    expect(create.status()).toBe(201);
    const goal = await create.json();
    expect(goal.id).toBeDefined();
    expect(goal.status).toBe('ACTIVE');

    // Aportar 50€ -> 25%
    const c1 = await request.post(BASE + '/api/v1/savings/goals/' + goal.id + '/contributions', {
      headers: { Authorization: 'Bearer ' + token },
      data: { amount: 50, sourceAccountId: 'acc00000-0000-0000-0000-000000000001' }
    });
    expect(c1.status()).toBe(201);

    // Detalle
    const detail = await request.get(BASE + '/api/v1/savings/goals/' + goal.id, {
      headers: { Authorization: 'Bearer ' + token }
    });
    expect(detail.status()).toBe(200);
    const d = await detail.json();
    expect(parseFloat(d.goal.reservedAmount)).toBeCloseTo(50, 2);
    expect(parseFloat(d.goal.progressPct)).toBeCloseTo(25, 0);

    // Milestones
    const ms = await request.get(BASE + '/api/v1/savings/goals/' + goal.id + '/milestones', {
      headers: { Authorization: 'Bearer ' + token }
    });
    expect(ms.status()).toBe(200);
    const msArr = await ms.json();
    expect(msArr.find((m: any) => m.percent === 25)).toBeTruthy();

    // Cerrar (reserved=50 > 30 -> requiere SCA via header X-OTP)
    const close = await request.delete(BASE + '/api/v1/savings/goals/' + goal.id, {
      headers: { Authorization: 'Bearer ' + token, 'X-OTP': '123456' }
    });
    expect(close.status()).toBe(200);
    const cj = await close.json();
    expect(parseFloat(cj.returnedAmount)).toBeCloseTo(50, 2);
  });

  test('TC-E2E-002 · ownership: user2 no puede acceder a goal de user1', async ({ request }) => {
    const t2res = await request.get(BASE + '/dev/token?email=maria.garcia@nemtec.es');
    const tok2 = (await t2res.json()).accessToken;

    const create = await request.post(BASE + '/api/v1/savings/goals', {
      headers: { Authorization: 'Bearer ' + token },
      data: { name: 'E2E Ownership ' + Date.now(), targetAmount: 100, targetDate: '2027-12-31', category: 'OTROS', icon: 'piggy-bank', color: '#10B981', sourceAccountId: 'acc00000-0000-0000-0000-000000000001' }
    });
    const goal = await create.json();

    const r1 = await request.get(BASE + '/api/v1/savings/goals/' + goal.id, {
      headers: { Authorization: 'Bearer ' + tok2 }
    });
    expect(r1.status()).toBe(403);

    const r2 = await request.delete(BASE + '/api/v1/savings/goals/' + goal.id, {
      headers: { Authorization: 'Bearer ' + tok2 }
    });
    expect(r2.status()).toBe(403);
  });

  test('TC-E2E-003 · SCA: cierre con reserved>30 requiere OTP correcto', async ({ request }) => {
    const create = await request.post(BASE + '/api/v1/savings/goals', {
      headers: { Authorization: 'Bearer ' + token },
      data: { name: 'E2E SCA ' + Date.now(), targetAmount: 150, targetDate: '2027-12-31', category: 'OTROS', icon: 'piggy-bank', color: '#10B981', sourceAccountId: 'acc00000-0000-0000-0000-000000000001' }
    });
    const goal = await create.json();
    await request.post(BASE + '/api/v1/savings/goals/' + goal.id + '/contributions', {
      headers: { Authorization: 'Bearer ' + token },
      data: { amount: 50, sourceAccountId: 'acc00000-0000-0000-0000-000000000001' }
    });

    // sin OTP -> 401
    const noOtp = await request.delete(BASE + '/api/v1/savings/goals/' + goal.id, {
      headers: { Authorization: 'Bearer ' + token }
    });
    expect(noOtp.status()).toBe(401);

    // OTP incorrecto -> 401
    const bad = await request.delete(BASE + '/api/v1/savings/goals/' + goal.id, {
      headers: { Authorization: 'Bearer ' + token, 'X-OTP': '000000' }
    });
    expect(bad.status()).toBe(401);

    // OTP bypass -> 200
    const ok = await request.delete(BASE + '/api/v1/savings/goals/' + goal.id, {
      headers: { Authorization: 'Bearer ' + token, 'X-OTP': '123456' }
    });
    expect(ok.status()).toBe(200);
  });

  test('TC-E2E-004 · auto-rule: configurar y pausar', async ({ request }) => {
    const create = await request.post(BASE + '/api/v1/savings/goals', {
      headers: { Authorization: 'Bearer ' + token },
      data: { name: 'E2E AR ' + Date.now(), targetAmount: 100, targetDate: '2027-12-31', category: 'EMERGENCIA', icon: 'shield', color: '#F59E0B', sourceAccountId: 'acc00000-0000-0000-0000-000000000001' }
    });
    const goal = await create.json();

    const set = await request.put(BASE + '/api/v1/savings/goals/' + goal.id + '/auto-rule', {
      headers: { Authorization: 'Bearer ' + token },
      data: { amount: 25, dayOfMonth: 5, sourceAccountId: 'acc00000-0000-0000-0000-000000000001' }
    });
    expect(set.status()).toBe(200);
    const ar = await set.json();
    expect(ar.dayOfMonth).toBe(5);
    expect(ar.active).toBe(true);

    const pause = await request.delete(BASE + '/api/v1/savings/goals/' + goal.id + '/auto-rule', {
      headers: { Authorization: 'Bearer ' + token }
    });
    expect(pause.status()).toBe(204);
  });

  test('TC-E2E-005 · seguridad: sin token, token mal formado, SQL inj', async ({ request }) => {
    const noTok = await request.get(BASE + '/api/v1/savings/dashboard-widget');
    expect(noTok.status()).toBe(401);

    const badTok = await request.get(BASE + '/api/v1/savings/dashboard-widget', {
      headers: { Authorization: 'Bearer garbage.jwt.token' }
    });
    expect(badTok.status()).toBe(401);

    const sqli = await request.get(BASE + "/api/v1/savings/goals/" + encodeURIComponent("' OR '1'='1"), {
      headers: { Authorization: 'Bearer ' + token }
    });
    expect(sqli.status()).toBe(400);
    const j = await sqli.json();
    expect(j.error).toBe('BAD_REQUEST');
  });

  test('TC-E2E-006 · widget degradación: usuario nuevo sin goals', async ({ request }) => {
    const t2 = await request.get(BASE + '/dev/token?email=maria.garcia@nemtec.es');
    const tok2 = (await t2.json()).accessToken;
    const w = await request.get(BASE + '/api/v1/savings/dashboard-widget', {
      headers: { Authorization: 'Bearer ' + tok2 }
    });
    expect(w.status()).toBe(200);
    const j = await w.json();
    expect(j.activeGoalsCount).toBe(0);
    expect(j.topGoals).toEqual([]);
  });
});
