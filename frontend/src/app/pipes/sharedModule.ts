// shared.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsPipe } from '../pipes/products.pipe';

@NgModule({
  declarations: [ProductsPipe],
  exports: [ProductsPipe, CommonModule],
})
export class SharedModule { }
