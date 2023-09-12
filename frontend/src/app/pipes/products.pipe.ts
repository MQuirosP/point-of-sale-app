import { Products } from './../interfaces/products';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'productsFilter'
})
export class ProductsPipe implements PipeTransform {

  transform(products: Products[], page: number = 0, search: string = ''): Products[] {
    if (search.trim() === '') {
      return products.slice(page, page + 7);
    }

    const searchTermLower = search.toLowerCase();

    const filteredProducts = products.filter((product) => {
      const productNameLower = product.name.toLowerCase();
      const productCodeLower = product.int_code.toLowerCase();

      return (
        productNameLower.includes(searchTermLower) ||
        productCodeLower.includes(searchTermLower)
      );
    });

    return filteredProducts.slice(page, page + 7);
  }

}
