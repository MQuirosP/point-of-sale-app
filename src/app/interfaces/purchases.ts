export interface Purchase {
  createdAt: string;
  doc_number: string;
  provider_name: string;
  purchaseId: number;
  purchaseItems: PurchaseItem[];
  showDetails: boolean;
  status: string;
  sub_total: number;
  taxes_amount: number;
  total: number;
  updatedAt: string;
  providerId: number;
  paymentMethod: string;
  products: [];
}

export interface PurchaseItem {
  int_code: string;
  name: string;
  purchase_price: number;
  quantity: number;
  sub_total: number;
  taxes_amount: number;
  total: number;
}
