import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BizumService } from '../../services/bizum.service';
import { BizumStatus_Resp } from '../../models/bizum.model';

@Component({ selector: 'app-bizum-settings', templateUrl: './bizum-settings.component.html' })
export class BizumSettingsComponent implements OnInit {
  status: BizumStatus_Resp = { active: false, phoneMasked: '', dailyUsed: 0, dailyLimit: 2000, perOperationLimit: 500 };
  pushPayments = true;
  pushRequests = true;
  pushExpiry   = true;

  constructor(private svc: BizumService, private router: Router) {}

  ngOnInit(): void { this.svc.getStatus().subscribe(s => this.status = s); }

  get usedPct(): number {
    return Math.min(100, Math.round((this.status.dailyUsed / this.status.dailyLimit) * 100));
  }

  deactivate(): void {
    if (!confirm('Desactivar Bizum - estas seguro?')) return;
    this.svc.deactivate().subscribe({
      next: () => this.router.navigateByUrl('/bizum'),
      error: () => alert('Error al desactivar Bizum')
    });
  }

  back(): void { this.router.navigateByUrl('/bizum'); }
}
