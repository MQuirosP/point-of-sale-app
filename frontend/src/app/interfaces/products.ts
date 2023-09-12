export interface Products {
  productId?: number;
  int_code?: string;
  name?: string;
  description?: string;
  quantity?: number;
  price?: number; // revisar en purchase-history para eliminar
  category_id?: number;
  category_name?: string;
  sale_price?: number;
  purchase_price?: number;
  taxes?: boolean;
  taxes_amount?: number;
  sub_total?: number;
  total?: number;
  taxPercentage: number;
  margin: number;
  showIcons?: boolean;
  isRemoved?: boolean;
  isNew?: boolean;
}

export interface allProducts {
  count: number;
  next: null;
  previous: null;
  results: smallDescription[];
}

export interface smallDescription {
  int_code: string;
  name: string;
}
