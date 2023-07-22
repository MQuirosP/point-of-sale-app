export interface Products {
    productId:number,
      int_code: string,
      name: string,
      description: string,
      quantity: number,
      purchase_price: number,
      sale_price: number,
      taxes: boolean,
      taxPercentage: number
      margin: number,
      showIcons: boolean,
}

export interface allProducts {
    count:    number;
    next:     null;
    previous: null;
    results:  smallDescription[];
}

export interface smallDescription {
    int_code: string;
    name: string;
}
