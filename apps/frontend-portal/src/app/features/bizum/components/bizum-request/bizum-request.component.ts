import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BizumService } from '../../services/bizum.service';

export interface BizumIncomingRequest {
  id: string;
  requesterPhone: string;
  amount: number;
  concept: string;
  expiresIn: string;
}

@Component({ selector: 'app-bizum-request', templateUrl: './bizum-request.component.html' })
export class BizumRequestComponent implements OnInit {
  recipientPhoneCtrl = new FormControl('', [Validators.required]);
  amountCtrl         = new FormControl('', [Validators.required, Validators.min(0.01), Validators.max(500)]);
  conceptCtrl        = new FormControl('');
  form = new FormGroup({ recipientPhone: this.recipientPhoneCtrl, amount: this.amountCtrl, concept: this.conceptCtrl });
  loading = false;
  error   = '';
  incomingRequests: BizumIncomingRequest[] = [];

  constructor(private svc: BizumService, private router: Router) {}

  ngOnInit(): void {
    this.svc.getIncomingRequests().subscribe({ next: r => this.incomingRequests = r, error: () => {} });
  }

  send(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.svc.sendRequest({
      recipientPhone: this.recipientPhoneCtrl.value!,
      amount: +this.amountCtrl.value!,
      concept: this.conceptCtrl.value || ''
    }).subscribe({
      next: () => this.router.navigateByUrl('/bizum/historial'),
      error: (e: any) => { this.error = e.error?.message || 'Error al enviar'; this.loading = false; }
    });
  }

  rejectRequest(id: string): void {
    this.svc.rejectRequest(id).subscribe({
      next: () => this.incomingRequests = this.incomingRequests.filter(r => r.id !== id),
      error: () => {}
    });
  }

  acceptRequest(req: BizumIncomingRequest): void {
    const otp = prompt('Introduce el codigo OTP (STG bypass: 123456)');
    if (!otp) return;
    this.svc.acceptRequest(req.id, otp).subscribe({
      next: () => this.incomingRequests = this.incomingRequests.filter(r => r.id !== req.id),
      error: (e: any) => alert(e.error?.message || 'OTP invalido')
    });
  }

  back(): void { this.router.navigateByUrl('/bizum'); }
}
