import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'; // Importa NgbModule aquí
import { ShoppingCartComponent } from './shopping-cart.component';

@NgModule({
  declarations: [ShoppingCartComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: ShoppingCartComponent }]),
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
  ],
})
export class ShoppingCartModule {}
