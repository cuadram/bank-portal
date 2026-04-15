import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BizumService } from '../../services/bizum.service';
import { BizumRequest } from '../../models/bizum.model';

@Component({ selector: 'app-bizum-request', templateUrl: './bizum-request.component.html' })
export class BizumRequestComponent implements OnInit {
  recipientPhoneCtrl = new FormControl('', [Validators.required]);
  amountCtrl = new FormControl('', [Validators.required, Validators.min(0.01), Validators.max(500)]);
  conceptCtrl = new FormControl('');
  form = new FormGroup({ recipientPhone: this.recipientPhoneCtrl, amount: this.amountCtrl, concept: this.conceptCtrl });
  loading = false;
  error = '';
  incomingRequests: BizumRequest[] = [];

  constructor(private svc: BizumService, private router: Router) {}

  ngOnInit(): void {
    // Las solicitudes recibidas pendientes se muestran desde el historial de transacciones
    // filtrando las que tienen type=RECEIVED y status=PENDING
    this.svc.getTransactions(0, 50).subscribe({
      next: txs => {
        // Convertir BizumPayment a BizumRequest para las solicitudes recibidas pendientes
        const pending = txs.filter(t => t.status === 'PENDING' && t.type === 'RECEIVED');
        this.incomingRequests = pending.map(t => ({
          id: t.id,
          amount: t.amount,
          phoneMasked: t.phoneMasked,
          concept: t.concept,
          status: t.status,
          expiresAt: ''
        }));
      },
      error: () => {}
    });
  }

  send(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.svc.requestMoney({
      recipientPhone: this.recipientPhoneCtrl.value!,
      amount: +this.amountCtrl.value!,
      concept: this.conceptCtrl.value || ''
    }).subscribe({
      next: () => this.router.navigateByUrl('/bizum/historial'),
      error: e => { this.error = e.error?.message || 'Error al enviar solicitud'; this.loading = false; }
    });
  }

  rejectRequest(id: string): void {
    this.svc.resolveRequest(id, { action: 'REJECTED' }).subscribe({
      next: () => this.incomingRequests = this.incomingRequests.filter(r => r.id !== id),
      error: () => {}
    });
  }

  acceptRequest(req: BizumRequest): void {
    const otp = prompt('Introduce el codigo OTP (STG bypass: 123456)');
    if (!otp) return;
    this.svc.resolveRequest(req.id, { action: 'ACCEPTED', otp }).subscribe({
      next: () => this.incomingRequests = this.incomingRequests.filter(r => r.id !== req.id),
      error: e => alert(e.error?.message || 'OTP invalido')
    });
  }

  back(): void { this.router.navigateByUrl('/bizum'); }
}
