import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { of, throwError } from 'rxjs';
import { AccountListComponent } from './account-list.component';
import { AccountService, AccountSummary } from '../../services/account.service';

/**
 * US-701 — Tests unitarios AccountListComponent.
 *
 * @author SOFIA Developer Agent — FEAT-007 Sprint 9
 */
describe('AccountListComponent', () => {
  let component: AccountListComponent;
  let fixture: ComponentFixture<AccountListComponent>;
  let accountServiceSpy: jasmine.SpyObj<AccountService>;

  const mockAccounts: AccountSummary[] = [
    {
      id: 'acc-1', alias: 'Cuenta Corriente',
      ibanMasked: 'ES91 **** **** **** 1332',
      type: 'CORRIENTE', availableBalance: 3842.55, retainedBalance: 250.00
    },
    {
      id: 'acc-2', alias: 'Cuenta Ahorro',
      ibanMasked: 'ES76 **** **** **** 5766',
      type: 'AHORRO', availableBalance: 12500.00, retainedBalance: 0
    }
  ];

  beforeEach(async () => {
    accountServiceSpy = jasmine.createSpyObj('AccountService', ['getAccounts']);

    await TestBed.configureTestingModule({
      declarations: [AccountListComponent],
      imports: [CommonModule],
      providers: [{ provide: AccountService, useValue: accountServiceSpy }]
    }).compileComponents();

    fixture   = TestBed.createComponent(AccountListComponent);
    component = fixture.componentInstance;
  });

  // ── US-701: happy path ────────────────────────────────────────────────────

  it('US-701: muestra 2 cuentas activas con saldo', fakeAsync(() => {
    // Arrange
    accountServiceSpy.getAccounts.and.returnValue(of(mockAccounts));
    // Act
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    // Assert
    expect(component.accounts.length).toBe(2);
    expect(component.loading).toBeFalse();
    expect(component.error).toBeFalse();
    const aliases = component.accounts.map(a => a.alias);
    expect(aliases).toContain('Cuenta Corriente');
    expect(aliases).toContain('Cuenta Ahorro');
  }));

  it('US-701: muestra saldo disponible correctamente', fakeAsync(() => {
    // Arrange
    accountServiceSpy.getAccounts.and.returnValue(of(mockAccounts));
    // Act
    fixture.detectChanges(); tick();
    // Assert
    expect(component.accounts[0].availableBalance).toBe(3842.55);
    expect(component.accounts[1].availableBalance).toBe(12500.00);
  }));

  it('US-701: IBAN enmascarado no expone número completo', fakeAsync(() => {
    // Arrange
    accountServiceSpy.getAccounts.and.returnValue(of(mockAccounts));
    // Act
    fixture.detectChanges(); tick();
    // Assert
    component.accounts.forEach(a => {
      expect(a.ibanMasked).not.toMatch(/\d{10,}/);   // nunca 10+ dígitos consecutivos
      expect(a.ibanMasked).toContain('****');
    });
  }));

  // ── US-701: empty state ───────────────────────────────────────────────────

  it('US-701: sin cuentas — empty state visible', fakeAsync(() => {
    // Arrange
    accountServiceSpy.getAccounts.and.returnValue(of([]));
    // Act
    fixture.detectChanges(); tick();
    // Assert
    expect(component.accounts.length).toBe(0);
    expect(component.loading).toBeFalse();
  }));

  // ── US-701: error state ───────────────────────────────────────────────────

  it('US-701: error de servicio — flag error activado', fakeAsync(() => {
    // Arrange
    accountServiceSpy.getAccounts.and.returnValue(throwError(() => new Error('500')));
    // Act
    fixture.detectChanges(); tick();
    // Assert
    expect(component.error).toBeTrue();
    expect(component.loading).toBeFalse();
  }));

  it('US-701: skeleton visible durante carga', () => {
    // Arrange — no se resuelve la observable todavía
    accountServiceSpy.getAccounts.and.returnValue(new Promise(() => {}) as any);
    // Act
    fixture.detectChanges();
    // Assert — loading es true antes de la respuesta
    expect(component.loading).toBeTrue();
  });

  // ── typeLabel helper ──────────────────────────────────────────────────────

  it('typeLabel mapea CORRIENTE correctamente', () => {
    expect(component.typeLabel('CORRIENTE')).toBe('Cuenta corriente');
    expect(component.typeLabel('AHORRO')).toBe('Cuenta ahorro');
    expect(component.typeLabel('NOMINA')).toBe('Cuenta nómina');
    expect(component.typeLabel('OTRO')).toBe('OTRO');     // fallback
  });

  // ── selectAccount ─────────────────────────────────────────────────────────

  it('selectAccount actualiza la selección', fakeAsync(() => {
    // Arrange
    accountServiceSpy.getAccounts.and.returnValue(of(mockAccounts));
    fixture.detectChanges(); tick();
    // Act
    component.selectAccount(mockAccounts[1]);
    // Assert
    expect(component.selected).toEqual(mockAccounts[1]);
  }));
});
