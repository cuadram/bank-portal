import { Component, OnInit } from '@angular/core';
import { BizumService } from '../../services/bizum.service';
import { BizumPayment } from '../../models/bizum.model';

@Component({ selector: 'app-bizum-history', templateUrl: './bizum-history.component.html' })
export class BizumHistoryComponent implements OnInit {
  transactions: BizumPayment[] = [];
  loading = true;
  filter = 'ALL';

  constructor(private svc: BizumService) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.svc.getTransactions(0, 20).subscribe(t => { this.transactions = t; this.loading = false; });
  }

  setFilter(f: string): void { this.filter = f; }

  get filtered(): BizumPayment[] {
    if (this.filter === 'ALL') return this.transactions;
    return this.transactions.filter(t => t.type === this.filter || t.status === this.filter);
  }
}
