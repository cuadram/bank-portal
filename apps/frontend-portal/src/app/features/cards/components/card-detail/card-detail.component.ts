import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Card } from '../../models/card.model';
import { CardService } from '../../services/card.service';

@Component({
  selector: 'app-card-detail',
  templateUrl: './card-detail.component.html',
})
export class CardDetailComponent implements OnInit {
  card?: Card;
  loading = true;
  activeAction: 'none' | 'block' | 'unblock' | 'limits' | 'pin' = 'none';
  limitsForm!: FormGroup;
  pinForm!: FormGroup;
  actionSuccess = false;
  actionError = '';

  constructor(
    private route: ActivatedRoute,
    private cardService: CardService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const cardId = this.route.snapshot.paramMap.get('id')!;
    this.cardService.getCard(cardId).subscribe({
      next: (card) => {
        this.card = card;
        this.loading = false;
        this.initLimitsForm(card);
        this.initPinForm();
      },
      error: () => { this.loading = false; }
    });
  }

  // ── Formulario límites ────────────────────────────────────────────────────

  initLimitsForm(card: Card): void {
    this.limitsForm = this.fb.group({
      dailyLimit: [card.dailyLimit, [
        Validators.required,
        Validators.min(card.dailyLimitMin),
        Validators.max(card.dailyLimitMax)
      ]],
      monthlyLimit: [card.monthlyLimit, [
        Validators.required,
        Validators.min(card.monthlyLimitMin),
        Validators.max(card.monthlyLimitMax)
      ]],
      otpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    }, { validators: this.monthlyAboveDailyValidator });
  }

  monthlyAboveDailyValidator(group: AbstractControl): ValidationErrors | null {
    const daily = group.get('dailyLimit')?.value;
    const monthly = group.get('monthlyLimit')?.value;
    return monthly < daily ? { monthlyBelowDaily: true } : null;
  }

  submitLimits(): void {
    if (this.limitsForm.invalid || !this.card) return;
    const { dailyLimit, monthlyLimit, otpCode } = this.limitsForm.value;
    this.cardService.updateLimits(this.card.id, { dailyLimit, monthlyLimit, otpCode }).subscribe({
      next: () => { this.actionSuccess = true; this.activeAction = 'none'; },
      error: (e) => { this.actionError = e.error?.message || 'Error al actualizar límites'; }
    });
  }

  // ── Formulario PIN ────────────────────────────────────────────────────────

  initPinForm(): void {
    this.pinForm = this.fb.group({
      newPin: ['', [
        Validators.required,
        Validators.pattern(/^\d{4}$/),
        this.trivialPinValidator
      ]],
      otpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  trivialPinValidator(ctrl: AbstractControl): ValidationErrors | null {
    const val = ctrl.value;
    const trivial = /^(\d)\1{3}$|^1234$|^4321$|^0000$|^9999$/;
    return trivial.test(val) ? { pinTrivial: true } : null;
  }

  submitPin(): void {
    if (this.pinForm.invalid || !this.card) return;
    const { newPin, otpCode } = this.pinForm.value;
    this.cardService.changePin(this.card.id, { newPin, otpCode }).subscribe({
      next: () => { this.actionSuccess = true; this.activeAction = 'none'; this.pinForm.reset(); },
      error: (e) => { this.actionError = e.error?.message || 'Error al cambiar PIN'; }
    });
  }

  // ── Bloqueo / Desbloqueo ──────────────────────────────────────────────────

  blockCard(otpCode: string): void {
    if (!this.card) return;
    this.cardService.blockCard(this.card.id, otpCode).subscribe({
      next: () => { this.card!.status = 'BLOCKED'; this.activeAction = 'none'; },
      error: (e) => { this.actionError = e.error?.message || 'Error al bloquear'; }
    });
  }

  unblockCard(otpCode: string): void {
    if (!this.card) return;
    this.cardService.unblockCard(this.card.id, otpCode).subscribe({
      next: () => { this.card!.status = 'ACTIVE'; this.activeAction = 'none'; },
      error: (e) => { this.actionError = e.error?.message || 'Error al desbloquear'; }
    });
  }
}
