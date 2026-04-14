import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BizumService } from '../../services/bizum.service';
import { BizumPayment, BizumStatus_Resp } from '../../models/bizum.model';

@Component({ selector: 'app-bizum-home', templateUrl: './bizum-home.component.html' })
export class BizumHomeComponent implements OnInit {
  status: BizumStatus_Resp = { active: false, phoneMasked: '', dailyUsed: 0, dailyLimit: 2000, perOperationLimit: 500 };
  transactions: BizumPayment[] = [];
  loading = true;

  constructor(private svc: BizumService, private router: Router) {}

  ngOnInit(): void {
    this.svc.getStatus().subscribe(s => { this.status = s; this.loading = false; });
    this.svc.getTransactions(0, 3).subscribe(t => this.transactions = t);
  }

  navigateTo(path: string): void { this.router.navigateByUrl(path); } // LA-023-01: nunca [href]

  get limitPct(): number {
    return Math.min(100, Math.round((this.status.dailyUsed / this.status.dailyLimit) * 100));
  }
}
