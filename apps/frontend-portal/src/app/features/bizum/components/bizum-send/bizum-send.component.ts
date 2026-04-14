import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BizumService } from '../../services/bizum.service';

@Component({ selector: 'app-bizum-send', templateUrl: './bizum-send.component.html' })
export class BizumSendComponent {
  form: FormGroup;
  step = 1;
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private svc: BizumService, private router: Router) {
    this.form = this.fb.group({
      recipientPhone: ['', [Validators.required, Validators.pattern(/^\+[1-9]\d{6,14}$/)]],
      amount: ['', [Validators.required, Validators.min(0.01), Validators.max(500)]],
      concept: ['', Validators.maxLength(35)],
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  goToConfirm(): void { if (this.form.get('recipientPhone')?.valid && this.form.get('amount')?.valid) this.step = 2; }

  confirm(): void {
    this.loading = true; this.error = '';
    this.svc.sendPayment(this.form.value).subscribe({
      next: () => { this.loading = false; this.router.navigateByUrl('/bizum'); },
      error: (e) => { this.loading = false; this.error = e.error?.message || 'Error al enviar el pago'; }
    });
  }

  get recipientPhoneCtrl(): FormControl { return this.form.get('recipientPhone') as FormControl; }
  get amountCtrl(): FormControl { return this.form.get('amount') as FormControl; }
  get conceptCtrl(): FormControl { return this.form.get('concept') as FormControl; }
  get otpCtrl(): FormControl { return this.form.get('otp') as FormControl; }

  back(): void { this.step === 2 ? this.step = 1 : this.router.navigateByUrl('/bizum'); }
}
