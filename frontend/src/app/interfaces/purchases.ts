import { Products } from "./products";

export interface Purchase {
  providerId: number;
  provider_name: string;
  paymentMethod: string;
  doc_number: string;
  status: string;
  sub_total: number;
  taxes_amount: number;
  // products: any[];
  showDetails?: boolean;
  createdAt: string;
  purchaseItems: PurchaseItem[];
  total: number
}

export interface PurchaseItem extends Products {
  int_code: string;
  name: string;
  purchase_price: number;
  quantity: number;
  sub_total: number;
  taxes_amount: number;
  total: number;
}
