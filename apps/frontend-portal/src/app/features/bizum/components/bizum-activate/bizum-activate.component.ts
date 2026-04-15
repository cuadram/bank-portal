import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BizumService } from '../../services/bizum.service';

@Component({ selector: 'app-bizum-activate', templateUrl: './bizum-activate.component.html' })
export class BizumActivateComponent {
  phoneCtrl = new FormControl('', [Validators.required, Validators.pattern(/^\+[1-9]\d{6,14}$/)]);
  loading = false;
  error = '';

  constructor(private svc: BizumService, private router: Router) {}

  activate(): void {
    if (!this.phoneCtrl.value) return;
    this.loading = true;
    // activate() requiere { phone, accountId } — accountId se obtiene del backend implícitamente
    // en STG usamos la cuenta principal del usuario (primer account)
    this.svc.activate({ phone: this.phoneCtrl.value, accountId: '' }).subscribe({
      next: () => this.router.navigateByUrl('/bizum'),
      error: (e) => { this.error = e.error?.message || 'Error al activar Bizum'; this.loading = false; }
    });
  }

  back(): void { this.router.navigateByUrl('/bizum'); }
}
