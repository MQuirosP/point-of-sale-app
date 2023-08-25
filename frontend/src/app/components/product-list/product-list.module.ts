import { NgSelectModule } from '@ng-select/ng-select';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'; // Importa NgbModule aquí
import { ReactiveFormsModule } from '@angular/forms';
import { ProductListComponent } from './product-list.component';
import { ProductsPipe } from 'src/app/pipes/products.pipe';
import { SharedModule } from 'src/app/pipes/sharedModule';

@NgModule({
  declarations: [ProductListComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: ProductListComponent }]),
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
    NgSelectModule,
    SharedModule,
  ],
})
export class ProductListModule {}

