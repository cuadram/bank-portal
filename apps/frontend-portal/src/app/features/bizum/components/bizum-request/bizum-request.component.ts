import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BizumService } from '../../services/bizum.service';

@Component({ selector: 'app-bizum-request', templateUrl: './bizum-request.component.html' })
export class BizumRequestComponent {
  form: FormGroup;
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private svc: BizumService, private router: Router) {
    this.form = this.fb.group({
      recipientPhone: ['', [Validators.required, Validators.pattern(/^\+[1-9]\d{6,14}$/)]],
      amount: ['', [Validators.required, Validators.min(0.01), Validators.max(500)]],
      concept: ['', Validators.maxLength(35)]
    });
  }

  send(): void {
    this.loading = true;
    this.svc.requestMoney(this.form.value).subscribe({
      next: () => { this.loading = false; this.router.navigateByUrl('/bizum/historial'); },
      error: (e) => { this.loading = false; this.error = e.error?.message || 'Error al enviar la solicitud'; }
    });
  }

  back(): void { this.router.navigateByUrl('/bizum'); }
}
