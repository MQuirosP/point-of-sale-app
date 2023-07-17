import { PurchaseHistoryComponent } from './purchase-history.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'; // Importa NgbModule aquí
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [PurchaseHistoryComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: PurchaseHistoryComponent }]),
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
  ],
})
export class PurchaseHistoryModule {}

