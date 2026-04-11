import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Card, CardStatus } from '../../models/card.model';
import { CardService } from '../../services/card.service';

@Component({
  selector: 'app-card-list',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">💎 Tarjetas</h2>
          <p class="page-subtitle">Gestión de tus tarjetas bancarias</p>
        </div>
      </div>

      <!-- Skeleton -->
      <div class="cards-grid" *ngIf="loading">
        <div class="card-visual skeleton" *ngFor="let i of [1,2,3]">
          <div class="sk-line sk-short"></div>
          <div class="sk-line sk-long"></div>
          <div class="sk-line sk-medium"></div>
        </div>
      </div>

      <!-- Cards grid -->
      <div class="cards-grid" *ngIf="!loading">
        <div class="card-visual" *ngFor="let card of cards"
             [class.card-blocked]="card.status === 'BLOCKED'"
             [class.card-expired]="card.status === 'EXPIRED' || card.status === 'CANCELLED'"
             (click)="goToDetail(card.id)" role="button" tabindex="0"
             (keydown.enter)="goToDetail(card.id)">

          <div class="card-top">
            <span class="card-type-label">{{ card.cardType === 'DEBIT' ? 'DÉBITO' : 'CRÉDITO' }}</span>
            <span class="card-badge" [ngClass]="statusBadge(card.status).cssClass">
              {{ statusBadge(card.status).label }}
            </span>
          </div>

          <div class="card-chip">◼◼◼</div>

          <div class="card-pan">{{ card.panMasked }}</div>

          <div class="card-bottom">
            <div>
              <div class="card-meta-label">VENCIMIENTO</div>
              <div class="card-meta-value">{{ card.expirationDate }}</div>
            </div>
            <div class="card-logo">
              {{ card.cardType === 'CREDIT' ? 'VISA' : 'MC' }}
            </div>
          </div>

          <div class="card-limits-row">
            <div>
              <div class="limit-label">Límite diario</div>
              <div class="limit-value">{{ card.dailyLimit | currency:'EUR':'symbol':'1.0-0':'es' }}</div>
            </div>
            <div>
              <div class="limit-label">Límite mensual</div>
              <div class="limit-value">{{ card.monthlyLimit | currency:'EUR':'symbol':'1.0-0':'es' }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!loading && cards.length === 0">
        No tienes tarjetas registradas.
      </div>
    </div>
  `,
  styles: [`
    .page-container { font-family: Arial, sans-serif; }
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
    .page-title { color:#1B3A6B; margin:0; font-size:1.5rem; }
    .page-subtitle { color:#888; margin:.25rem 0 0; font-size:.9rem; }

    /* Grid de tarjetas */
    .cards-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1.5rem; }

    /* Tarjeta visual — aspecto físico */
    .card-visual {
      background: linear-gradient(135deg, #1B3A6B 0%, #2d5aa0 60%, #1a4080 100%);
      border-radius:16px; padding:1.5rem; color:#fff; cursor:pointer;
      box-shadow: 0 8px 24px rgba(27,58,107,.35);
      transition: transform .2s, box-shadow .2s;
      min-height: 200px;
      display: flex; flex-direction: column; justify-content: space-between;
      position: relative; overflow: hidden;
    }
    .card-visual::before {
      content:''; position:absolute; top:-40px; right:-40px;
      width:160px; height:160px; border-radius:50%;
      background:rgba(255,255,255,.06);
    }
    .card-visual::after {
      content:''; position:absolute; bottom:-60px; right:20px;
      width:200px; height:200px; border-radius:50%;
      background:rgba(255,255,255,.04);
    }
    .card-visual:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(27,58,107,.45); }

    .card-blocked { background: linear-gradient(135deg, #5d5d5d 0%, #3d3d3d 100%); }
    .card-expired { background: linear-gradient(135deg, #888 0%, #555 100%); opacity:.7; }

    .card-top { display:flex; justify-content:space-between; align-items:center; }
    .card-type-label { font-size:.7rem; letter-spacing:.12em; font-weight:700; opacity:.8; }
    .card-badge { font-size:.7rem; font-weight:700; padding:.2rem .6rem; border-radius:20px; }
    .badge--green { background:rgba(46,125,50,.35); color:#a5d6a7; }
    .badge--red   { background:rgba(198,40,40,.35);  color:#ef9a9a; }
    .badge--gray  { background:rgba(255,255,255,.15); color:rgba(255,255,255,.7); }

    .card-chip { font-size:1.2rem; letter-spacing:.1em; opacity:.6; margin:.75rem 0; }

    .card-pan { font-size:1.1rem; font-family:'Courier New',monospace; letter-spacing:.15em; font-weight:600; }

    .card-bottom { display:flex; justify-content:space-between; align-items:flex-end; margin-top:.75rem; }
    .card-meta-label { font-size:.6rem; letter-spacing:.1em; opacity:.6; margin-bottom:.15rem; }
    .card-meta-value { font-size:.85rem; font-weight:600; }
    .card-logo { font-size:1.1rem; font-weight:900; letter-spacing:.05em; opacity:.85; }

    .card-limits-row {
      display:flex; justify-content:space-between;
      background:rgba(255,255,255,.1); border-radius:8px;
      padding:.6rem .9rem; margin-top:.9rem;
    }
    .limit-label { font-size:.62rem; opacity:.65; letter-spacing:.06em; margin-bottom:.15rem; }
    .limit-value { font-size:.85rem; font-weight:700; }

    /* Skeleton */
    .skeleton { background: linear-gradient(135deg, #e0e0e0, #c8c8c8) !important;
      box-shadow:none !important; cursor:default; }
    .sk-line { border-radius:4px; background:rgba(0,0,0,.08); margin-bottom:.75rem; }
    .sk-short  { height:12px; width:40%; }
    .sk-long   { height:20px; width:80%; }
    .sk-medium { height:12px; width:60%; }

    .empty-state { text-align:center; padding:3rem; color:#999; font-size:1rem; }
  `]
})
export class CardListComponent implements OnInit, OnDestroy {
  cards: Card[] = [];
  loading = true;

  constructor(private cardService: CardService, private router: Router) {}

  ngOnInit(): void {
    this.cardService.getCards().subscribe({
      next: cards => { this.cards = cards; this.loading = false; },
      error: ()    => { this.loading = false; }
    });
  }

  ngOnDestroy(): void {}

  statusBadge(status: CardStatus): { label: string; cssClass: string } {
    const map: Record<CardStatus, { label: string; cssClass: string }> = {
      ACTIVE:    { label: 'Activa',    cssClass: 'badge--green' },
      BLOCKED:   { label: 'Bloqueada', cssClass: 'badge--red'   },
      EXPIRED:   { label: 'Expirada',  cssClass: 'badge--gray'  },
      CANCELLED: { label: 'Cancelada', cssClass: 'badge--gray'  },
    };
    return map[status];
  }

  goToDetail(cardId: string): void { this.router.navigate(['/cards', cardId]); }
}
