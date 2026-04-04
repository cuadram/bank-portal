import { Component, OnInit } from '@angular/core';
import { DirectDebit, DebitFilterParams } from '../../models/mandate.model';
import { DirectDebitService } from '../../services/direct-debit.service';

/**
 * FEAT-017 Sprint 19 — DebitHistoryComponent
 * Paginated debit list with status/date filters.
 */
@Component({
  selector: 'app-debit-history',
  templateUrl: './debit-history.component.html'
})
export class DebitHistoryComponent implements OnInit {
  debits: DirectDebit[] = [];
  totalElements = 0;
  page = 0;
  loading = true;
  errorMsg = '';

  filters: DebitFilterParams = { page: 0, size: 20 };

  constructor(private service: DirectDebitService) {}

  ngOnInit(): void { this.loadDebits(); }

  loadDebits(): void {
    this.loading = true;
    this.service.getDebits(this.filters).subscribe({
      next: res => {
        this.debits = res.content;
        this.totalElements = res.totalElements;
        this.loading = false;
      },
      error: e => { this.errorMsg = e.message; this.loading = false; }
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente', CHARGED: 'Cobrado',
      RETURNED: 'Devuelto', REJECTED: 'Rechazado'
    };
    return labels[status] ?? status;
  }

  statusClass(status: string): string {
    const classes: Record<string, string> = {
      PENDING: 'status-pending', CHARGED: 'status-charged',
      RETURNED: 'status-returned', REJECTED: 'status-rejected'
    };
    return classes[status] ?? '';
  }
}
