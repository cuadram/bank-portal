import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Card, CardStatus } from '../../models/card.model';
import { CardService } from '../../services/card.service';

interface StatusBadge { label: string; cssClass: string; }

@Component({
  selector: 'app-card-list',
  templateUrl: './card-list.component.html',
})
export class CardListComponent implements OnInit, OnDestroy {
  cards: Card[] = [];
  loading = true;
  private sseSub?: Subscription;

  constructor(
    private cardService: CardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cardService.getCards().subscribe({
      next: (cards) => { this.cards = cards; this.loading = false; },
      error: () => { this.loading = false; }
    });

    // SSE: actualiza badge de estado sin recarga
    // Integra con SseService de FEAT-014 filtrando eventos CARD_*
  }

  ngOnDestroy(): void {
    this.sseSub?.unsubscribe();
  }

  updateCardStatus(cardId: string, newStatus: CardStatus): void {
    const card = this.cards.find(c => c.id === cardId);
    if (card) card.status = newStatus;
  }

  statusBadge(status: CardStatus): StatusBadge {
    const map: Record<CardStatus, StatusBadge> = {
      ACTIVE:    { label: 'Activa',    cssClass: 'badge badge--green'  },
      BLOCKED:   { label: 'Bloqueada', cssClass: 'badge badge--red'    },
      EXPIRED:   { label: 'Expirada',  cssClass: 'badge badge--gray'   },
      CANCELLED: { label: 'Cancelada', cssClass: 'badge badge--gray'   },
    };
    return map[status];
  }

  goToDetail(cardId: string): void {
    this.router.navigate(['/cards', cardId]);
  }
}
