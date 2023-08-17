export interface Sales {
  createdAt: string;
  customer_name: string;
  doc_number: string;
  paymentMethod: string;
  saleId: number;
  saleItems: SalesItem[];
  showDetails: boolean;
  status: string;
  sub_total: string;
  taxes_amount: string;
  total: number;
  updatedAt: string;
}

export interface SalesItem {
  int_code: string;
  name: string;
  quantity: number;
  sale_price: string;
  sub_total: string;
  taxes_amount: string;
  total: number;
}
