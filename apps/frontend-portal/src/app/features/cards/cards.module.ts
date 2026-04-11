import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { CardListComponent } from './components/card-list/card-list.component';
import { CardDetailComponent } from './components/card-detail/card-detail.component';

const routes: Routes = [
  { path: '',    component: CardListComponent  },
  { path: ':id', component: CardDetailComponent }
];

@NgModule({
  declarations: [CardListComponent, CardDetailComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class CardsModule {}
