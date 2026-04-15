import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BizumService } from '../../services/bizum.service';
import { BizumPayment } from '../../models/bizum.model';

interface Group { label: string; items: BizumPayment[]; }

@Component({ selector: 'app-bizum-history', templateUrl: './bizum-history.component.html' })
export class BizumHistoryComponent implements OnInit {
  all: BizumPayment[] = [];
  grouped: Group[] = [];
  filter = 'ALL';
  loading = true;

  constructor(private svc: BizumService, private router: Router) {}

  ngOnInit(): void {
    this.svc.getTransactions(0, 50).subscribe(t => {
      this.all = t; this.loading = false; this.applyFilter();
    });
  }

  setFilter(f: string): void { this.filter = f; this.applyFilter(); }

  applyFilter(): void {
    let items = this.all;
    if (this.filter === 'SENT') items = items.filter(t => t.type === 'SENT');
    else if (this.filter === 'RECEIVED') items = items.filter(t => t.type === 'RECEIVED' && t.status === 'COMPLETED');
    else if (this.filter === 'PENDING') items = items.filter(t => t.status === 'PENDING');
    else if (this.filter === 'REQUEST') items = items.filter(t => t.status === 'PENDING');

    const map = new Map<string, BizumPayment[]>();
    items.forEach(t => {
      const label = this.dateLabel(new Date(t.timestamp));
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(t);
    });
    this.grouped = Array.from(map.entries()).map(([label, items]) => ({ label, items }));
  }

  private dateLabel(d: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Hoy';
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  navigateTo(path: string): void { this.router.navigateByUrl(path); }
  back(): void { this.router.navigateByUrl('/bizum'); }
}
