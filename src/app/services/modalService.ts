import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  showNewSaleModal: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  selectedProductName: BehaviorSubject<string> = new BehaviorSubject<string>('');
  showEditProductModal: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  showNewProductModal: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  showDeletePasswordModal: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  showNewPurchaseModal: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  providerModal: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  customerModal: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor() { }

  resetModalState() {
    this.showNewSaleModal.next(false);
    
  }
}