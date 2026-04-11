import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommonModule }           from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChangeDetectorRef }      from '@angular/core';
import { of, throwError }         from 'rxjs';
import { TransactionListComponent } from './transaction-list.component';
import { AccountService, TransactionPage, Transaction } from '../../services/account.service';

/**
 * US-702/703 — Tests unitarios TransactionListComponent.
 *
 * @author SOFIA Developer Agent — FEAT-007 Sprint 9
 */
describe('TransactionListComponent', () => {
  let component: TransactionListComponent;
  let fixture:   ComponentFixture<TransactionListComponent>;
  let accountServiceSpy: jasmine.SpyObj<AccountService>;

  const txn = (id: string, concept: string, amount: number,
               type: 'CARGO'|'ABONO'): Transaction => ({
    id, accountId: 'acc-1',
    transactionDate: new Date().toISOString(),
    concept, amount, balanceAfter: 5000, category: 'OTRO', type
  });

  const mockPage = (items: Transaction[], total = items.length,
                    last = true): TransactionPage => ({
    content: items, totalElements: total,
    totalPages: 1, number: 0, size: 20, last
  });

  beforeEach(async () => {
    accountServiceSpy = jasmine.createSpyObj('AccountService', ['getTransactions']);

    await TestBed.configureTestingModule({
      declarations: [TransactionListComponent],
      imports: [CommonModule, FormsModule, ReactiveFormsModule],
      providers: [
        { provide: AccountService, useValue: accountServiceSpy },
        ChangeDetectorRef
      ]
    }).compileComponents();

    fixture           = TestBed.createComponent(TransactionListComponent);
    component         = fixture.componentInstance;
    component.accountId = 'acc-1';
  });

  // ── US-702: happy path ────────────────────────────────────────────────────

  it('US-702: carga y muestra primera página de movimientos', fakeAsync(() => {
    // Arrange
    const items = [
      txn('t1', 'NOMINA EMPRESA', 2000, 'ABONO'),
      txn('t2', 'MERCADONA',      -45,  'CARGO')
    ];
    accountServiceSpy.getTransactions.and.returnValue(of(mockPage(items, 2)));
    // Act
    fixture.detectChanges(); tick();
    // Assert
    expect(component.transactions.length).toBe(2);
    expect(component.totalElements).toBe(2);
    expect(component.loading).toBeFalse();
  }));

  it('US-702: "Cargar más" añade segunda página al listado', fakeAsync(() => {
    // Arrange — pág 1: 2 items, no es última
    const pag1 = [txn('t1', 'NOMINA', 2000, 'ABONO'), txn('t2', 'SUPERMERCADO', -50, 'CARGO')];
    const pag2 = [txn('t3', 'RECIBO LUZ', -80, 'CARGO')];
    accountServiceSpy.getTransactions.and.returnValues(
      of(mockPage(pag1, 3, false)),
      of(mockPage(pag2, 3, true))
    );
    // Act
    fixture.detectChanges(); tick();
    component.loadMore();
    tick();
    // Assert
    expect(component.transactions.length).toBe(3);
    expect(component.isLastPage).toBeTrue();
  }));

  it('US-702: empty state cuando no hay movimientos', fakeAsync(() => {
    // Arrange
    accountServiceSpy.getTransactions.and.returnValue(of(mockPage([], 0)));
    // Act
    fixture.detectChanges(); tick();
    // Assert
    expect(component.transactions).toEqual([]);
    expect(component.totalElements).toBe(0);
  }));

  it('US-702: error de servicio — loading queda false', fakeAsync(() => {
    // Arrange
    accountServiceSpy.getTransactions.and.returnValue(throwError(() => new Error('503')));
    // Act
    fixture.detectChanges(); tick();
    // Assert
    expect(component.loading).toBeFalse();
  }));

  // ── US-703: búsqueda full-text ────────────────────────────────────────────

  it('US-703: búsqueda con debounce 300ms envía query al servicio', fakeAsync(() => {
    // Arrange
    accountServiceSpy.getTransactions.and.returnValue(of(mockPage([])));
    fixture.detectChanges(); tick();
    const callsBefore = accountServiceSpy.getTransactions.calls.count();
    // Act — escribe "amazon" en el campo de búsqueda
    component.searchCtrl.setValue('amazon');
    tick(300);    // debounce
    fixture.detectChanges();
    // Assert
    const calls = accountServiceSpy.getTransactions.calls.count();
    expect(calls).toBeGreaterThan(callsBefore);
    const lastArgs = accountServiceSpy.getTransactions.calls.mostRecent().args;
    expect(lastArgs[1].q).toBe('amazon');
  }));

  it('US-703: query < 3 chars NO dispara búsqueda', fakeAsync(() => {
    // Arrange
    accountServiceSpy.getTransactions.and.returnValue(of(mockPage([])));
    fixture.detectChanges(); tick();
    const callsBefore = accountServiceSpy.getTransactions.calls.count();
    // Act
    component.searchCtrl.setValue('am');
    tick(300);
    // Assert — no debe haber enviado q al servicio
    const lastArgs = accountServiceSpy.getTransactions.calls.mostRecent().args;
    expect(lastArgs[1].q).toBeUndefined();
  }));

  it('US-703: highlight resalta el término buscado', () => {
    // Arrange
    component.filter.q = 'amazon';
    // Act
    const result = component.highlight('Pago AMAZON Prime mensual');
    // Assert
    expect(result).toContain('<mark>AMAZON</mark>');
  });

  it('US-703: highlight sin query devuelve texto sin modificar', () => {
    // Arrange
    component.filter.q = undefined;
    // Act
    const result = component.highlight('Pago AMAZON Prime');
    // Assert
    expect(result).toBe('Pago AMAZON Prime');
  });

  // ── filtros ───────────────────────────────────────────────────────────────

  it('clearFilters resetea todos los filtros y recarga', fakeAsync(() => {
    // Arrange
    accountServiceSpy.getTransactions.and.returnValue(of(mockPage([])));
    component.filter = { type: 'CARGO', q: 'netflix' };
    fixture.detectChanges(); tick();
    // Act
    component.clearFilters();
    tick();
    // Assert
    expect(component.filter).toEqual({});
    expect(component.searchCtrl.value).toBe('');
  }));

  it('hasActiveFilters retorna true cuando hay filtros activos', () => {
    component.filter = { type: 'CARGO' };
    expect(component.hasActiveFilters()).toBeTrue();
    component.filter = {};
    expect(component.hasActiveFilters()).toBeFalse();
  });

  // ── trackById ─────────────────────────────────────────────────────────────

  it('trackById devuelve el id del movimiento', () => {
    const t = txn('txn-xyz', 'Test', 100, 'ABONO');
    expect(component.trackById(0, t)).toBe('txn-xyz');
  });
});
