import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { fadeAnimation } from 'src/app/fadeAnimation';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ProductCacheService } from 'src/app/services/product-cache.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  animations: [fadeAnimation],
})
export class ProductListComponent implements OnInit {
  @ViewChild('productModal', { static: false }) productModal!: ElementRef;
  @ViewChild('deletePasswordModal', { static: false })
  deletePasswordModal!: ElementRef;

  backendUrl: string = environment.apiUrl;

  subscription: Subscription = new Subscription();
  products: any[] = [];
  filteredProducts: any[] = [];
  searchTerm: string = '';
  currentSlide: number = 0;

  showScrollButton: boolean = false;

  productForm: FormGroup;
  modalTitle: string;
  modalActionLabel: boolean = false;
  editMode: boolean = false;
  productInfo: any = {};

  password: string = '';

  isTaxed: boolean;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private http: HttpClient,
    private toastr: ToastrService,
    private formBuilder: FormBuilder
  )
  {
    this.productForm = this.formBuilder.group({
      productId: [0],
      int_code: [''],
      name: ['', Validators.required],
      description: ['', Validators.required],
      purchase_price: ['', Validators.required],
      sale_price: ['', Validators.required],
      taxes: [false],
      taxPercentage: new FormControl({ value: null, disabled: true }, Validators.required),
      margin: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.refreshProductList();
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    const scrollPos =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    this.showScrollButton = scrollPos > 0;
  }

  toggleTaxPercentage() {
    const taxPercentageControl = this.productForm.get('taxPercentage');
  
    if (this.productForm.get('taxes').value) {
      taxPercentageControl?.enable();
    } else {
      taxPercentageControl?.disable();
      taxPercentageControl?.setValue(0);
    }
  }

  isTaxPercentageDisabled() {
    return !this.productForm.get('taxes').value;
  }
  
  getTaxPercentageValue() {
    return this.productForm.get('taxes').value ? this.productForm.get('taxPercentage').value : 0;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  loadData() {
    if (this.products.length > 0) {
      return;
    }

    this.subscription = this.http.get(`${this.backendUrl}products`).subscribe({
      next: (response: any) => {
        if (
          response &&
          response.success &&
          response.message &&
          response.message.products &&
          response.message.products.length > 0
        ) {
          this.products = response.message.products.map((product: any) => {
            return { ...product, showIcons: false };
          });

          this.filteredProducts = [...this.products];
        }
      },
      error: (error) => {
        this.toastr.error('Error al obtener productos.', error);
      },
    });
  }

  refreshProductList() {
    this.http.get(`${this.backendUrl}products`).subscribe({
      next: (response: any) => {
        if (
          response &&
          response.success &&
          response.message &&
          response.message.products &&
          response.message.products.length > 0
        ) {
          this.products = response.message.products.map((product: any) => {
            return { ...product, showIcons: false };
          });

          this.filteredProducts = [...this.products];
          this.changeDetectorRef.detectChanges();
        }
      },
      error: (error) => {
        this.toastr.error('Error al obtener productos.', error);
      },
    });
  }

  filterProducts() {
    if (!this.searchTerm) {
      this.filteredProducts = [...this.products];
      return;
    }

    const searchTermNormalized = this.searchTerm
      ? this.searchTerm.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      : '';

    this.filteredProducts = this.products.filter((product: any) => {
      const productNameNormalized = product.name
        ? product.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        : '';

      const productCodeNormalized = product.int_code
        ? product.int_code.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        : '';

      const searchTermLower = searchTermNormalized.toLowerCase();

      return (
        productNameNormalized.toLowerCase().includes(searchTermLower) ||
        productCodeNormalized.toLowerCase().includes(searchTermLower)
      );
    });

    this.changeDetectorRef.detectChanges();
  }

  openProductModal(value: boolean, product_id: string) {
    let selectedProductId = null;
    if (value && product_id) {
      this.modalTitle = value ? 'Edición' : 'Registro';
      this.modalActionLabel = value;
      this.changeDetectorRef.detectChanges();
      this.productModal.nativeElement.classList.toggle('show');
      this.productModal.nativeElement.style.display = 'block';
      selectedProductId = product_id;

      setTimeout(() => {
        this.getProductInfo(selectedProductId);
      }, 300);
    } else {
      this.modalTitle = value ? 'Edición' : 'Registro';
      this.modalActionLabel = !value;
      this.productForm.reset();
      this.changeDetectorRef.detectChanges();
      this.productModal.nativeElement.classList.add('show');
      this.productModal.nativeElement.style.display = 'block';
    }
  }

  getProductInfo(product_id: number) {
    this.http.get(`${this.backendUrl}products/id/${product_id}`).subscribe({
      next: (response: any) => {
        if (response.success && response.message && response.message.product) {
          const product = response.message.product;
          this.updateProductForm(product);
          this.productInfo = { ...product };
          this.toastr.success('Información de producto recuperada con éxito.');
        } else {
          console.log('No se encontró el producto');
          this.toastr.warning('Producto no encontrado.');
        }
      },
      error: (error) => {
        console.log('Error al obtener el producto', error);
        this.toastr.error('Error al obtener el producto.');
      },
    });
  }

  private updateProductForm(product: any) {
    const {
      productId,
      int_code,
      name,
      description,
      purchase_price,
      sale_price,
      taxes,
      margin,
      taxPercentage,
    } = product;

    this.productForm.patchValue({
      productId,
      int_code,
      name,
      description,
      purchase_price,
      sale_price,
      taxes,
      margin,
      taxPercentage,
    });
  }

  editProduct(productId: number) {
    if (this.productForm.invalid) {
      this.toastr.error('Por favor, completa todos los campos requeridos.');
      return;
    }

    const productData = this.extractProductFormData();
    this.updateProduct(productId, productData);
  }

  private updateProduct(productId: number, productData: any) {
    this.http
      .put(`${this.backendUrl}products/${productId}`, productData)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastr.success('Producto actualizado exitosamente.');
            this.updateLocalProduct(productId, productData);
          } else {
            this.toastr.error('Error al actualizar el producto.');
          }
          this.refreshProductList();
        },
        error: (error: any) => {
          this.toastr.error('Error al actualizar el producto.', error);
        },
      });
  }

  private updateLocalProduct(productId: number, productData: any) {
    this.filteredProducts = this.products.map((product) => {
      if (product.producId === productId) {
        return productData;
      }
      return product;
    });
  }

  updateProductList(updatedProduct: any) {
    const index = this.products.findIndex(
      (product) => product.int_code === updatedProduct.int_code
    );
    if (index !== -1) {
      this.products[index] = { ...this.products[index], ...updatedProduct };
      this.filteredProducts = [...this.products];
    }
    this.loadData();
  }

  closeProductModal() {
    this.productModal.nativeElement.classList.remove('show');
    this.productModal.nativeElement.style.display = 'none';
    this.searchTerm = '';
    this.filterProducts();
  }

  createProduct() {
    if (this.modalActionLabel) {
      if (this.productForm.invalid) {
        this.toastr.error('Por favor, completa todos los campos requeridos.');
        return;
      }

      const productData = this.extractProductFormData();
      this.saveCustomer(productData);
    } else {
    }
  }

  private extractProductFormData() {
    return {
      int_code: this.productForm.get('int_code').value,
      name: this.productForm.get('name').value,
      description: this.productForm.get('description').value,
      purchase_price: this.productForm.get('purchase_price').value,
      sale_price: this.productForm.get('sale_price').value,
      taxes: this.productForm.get('taxes').value,
      margin: this.productForm.get('margin').value,
      taxPercentage: this.productForm.get('taxPercentage').value,
    };
  }

  private saveCustomer(productData: any) {
    this.changeDetectorRef.detectChanges();
    this.http.post(`${this.backendUrl}products`, productData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('Producto guardado exitosamente.'),
            this.resetProductForm();
          this.refreshProductList();
          this.closeProductModal();
        } else {
          this.toastr.error('Error al guardar el producto.');
        }
      },
      error: (error: any) => {
        this.toastr.error('Error al guardar el cliente.', error);
      },
    });
  }

  private resetProductForm() {
    this.productForm.reset();
  }

  calculateTotal(isEditForm: boolean = false): void {
    const purchasePrice = this.productForm.value.purchase_price;
    const margin = this.productForm.value.margin;
    const taxes = this.productForm.value.taxes;
    const taxPercentage = this.productForm.value.taxPercentage;

    // Almacenamos el valor anterior de sale_price
    const oldSalePrice = this.productForm.value.sale_price;

    if (!taxes) {
      if (!isNaN(purchasePrice) && !isNaN(margin)) {
        const total = purchasePrice / (1 - margin / 100);
        this.productForm.patchValue({ sale_price: Number(total.toFixed(2)) });
        if (isEditForm && total !== oldSalePrice) {
          // Verificamos si el valor ha cambiado antes de asignarlo
          this.productForm.patchValue({ sale_price: total.toFixed(2) });
        }
      } else {
        this.productForm.patchValue({ sale_price: 0 });
        if (isEditForm && oldSalePrice !== 0) {
          this.productForm.patchValue({ sale_price: 0 });
        }
      }
      this.changeDetectorRef.detectChanges()
    } else {
      if (!isNaN(purchasePrice) && !isNaN(margin)) {
        const total =
          purchasePrice / (1 - margin / 100) / (1 - taxPercentage / 100);
        this.productForm.patchValue({ sale_price: Number(total.toFixed(2)) });
        if (isEditForm && total !== oldSalePrice) {
          this.productForm.patchValue({ sale_price: Number(total.toFixed(2)) });
        }
      }
      this.changeDetectorRef.detectChanges();
    }
  }

  deleteProduct(intCode: string) {
    const password = this.password;
    const url = `${this.backendUrl}products/${intCode}`;

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      body: {
        password: password,
      },
    };

    this.http.delete(url, httpOptions).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success(`Producto eliminado satisfactoriamente.`);
          this.closePasswordModal();
          this.refreshProductList();
          this.searchTerm = '';
          this.password = '';
        } else {
          const errorMessage =
            response.message.error || 'Error al eliminar el producto.';
          this.toastr.error(errorMessage);
        }
      },
      error: (error: any) => {
        console.log(error.error.error);
        console.error('Error al eliminar el producto:', error.error.error);
        this.toastr.error(
          'Error al eliminar el producto: ' + error.error.error
        );
      },
    });
  }

  openPasswordModal(int_code: string) {
    this.deletePasswordModal.nativeElement.classList.toggle('show');
    this.deletePasswordModal.nativeElement.style.display = 'block';
    this.http.get(`${this.backendUrl}products/int_code/${int_code}`).subscribe({
      next: (response: any) => {
        if (
          response &&
          response.message &&
          response.message.product &&
          response.message.product.int_code &&
          response.message.product.name &&
          response.message.product.description &&
          response.message.product.sale_price
        ) {
          const product = response.message.product;
          const { int_code, name, description, quantity, sale_price } = product;

          this.productForm.patchValue({
            int_code,
            name,
            description,
            quantity,
            sale_price,
          });
        } else {
          console.log('No se encontró el producto');
          this.toastr.warning('Producto no encontrado.');
        }
      },
      error: (error) => {
        console.log('Error al obtener el producto', error);
        this.toastr.error('Error al obtener el producto.');
      },
    });
  }

  closePasswordModal() {
    this.deletePasswordModal.nativeElement.classList.remove('show');
    this.deletePasswordModal.nativeElement.style.display = 'none';
  }

  limitDecimals(field: string): void {
    const fieldValue = this.productForm.value[field];
    this.productForm.patchValue({ [field]: Number(fieldValue.toFixed(2)) });
  }
}
