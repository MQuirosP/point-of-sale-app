import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'


@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.css']
})
export class ShoppingCartComponent {
  selectedClient: string = 'Contado';
  selectedPaymentMethod: string = 'Contado';
  searchProduct: string = '';
  searchedProducts: any[] = []; // Aquí deberías definir el tipo de objeto para los productos
  totalSaleAmount: number = 0;

  constructor(private modalService: NgbModal) { }

  getCurrentDate(): string {
    const currentDate = new Date();
    return currentDate.toLocaleDateString();
  }

  searchProductByCode(): void {
    // Aquí puedes implementar la lógica para buscar los productos por código
    // y asignar los resultados a la variable searchedProducts
  }

  removeProduct(product: any): void {
    // Aquí puedes implementar la lógica para eliminar un producto de la lista
    // y recalcular el total de la venta
  }

  getTotalSaleAmount(): string {
    // Aquí puedes implementar la lógica para calcular el total de la venta
    // sumando los precios de los productos en searchedProducts
    // y retornar el valor formateado como un string
    return this.totalSaleAmount.toFixed(2);
  }

  guardarVenta(): void {
    // Lógica para guardar la venta en la base de datos
    // Mostrar ventana de confirmación

    // Reiniciar los valores del formulario
    this.selectedClient = 'Contado';
    this.selectedPaymentMethod = 'Contado';
    this.searchProduct = '';
    this.searchedProducts = [];
    this.totalSaleAmount = 0;

    // Cerrar el modal
    this.modalService.dismissAll();
  }

  openModal(content: any): void {
    this.modalService.open(content, { ariaLabelledBy: 'crearVentaModalLabel' }).result
      .then(() => {
        // Acción al guardar la venta
        this.guardarVenta();
      }, () => {
        // Acción al cerrar el modal sin guardar
      });
  }
}
