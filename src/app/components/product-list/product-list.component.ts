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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductCacheService } from 'src/app/services/product-cache.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  animations: [fadeAnimation],
})

export class ProductListComponent implements OnInit {
  @ViewChild('editProductModal', { static: false })
  editProductModal!: ElementRef;
  @ViewChild('addProductModal', { static: false }) addProductModal!: ElementRef;
  @ViewChild('deletePasswordModal', { static: false })
  deletePasswordModal!: ElementRef;

  backendUrl: string = environment.apiUrl;

  subscription: Subscription = new Subscription();
  products: any[] = [];
  filteredProducts: any[] = [];
  searchTerm: string = '';
  currentSlide: number = 0;
  // dataLoaded: boolean = false;

  showScrollButton: boolean = false;

  editForm: FormGroup;

  newProduct: {
    code: string;
    name: string;
    description: string;
    purchase_price: number;
    margin: number;
    sale_price: number;
    taxes: boolean;
    taxPercentage: number;
  } = {
    code: '',
    name: '',
    description: '',
    purchase_price: 0,
    margin: 0,
    sale_price: 0,
    taxes: false,
    taxPercentage: 0,
  };

  password: string = '';

  isTaxed: boolean;
  TAXES: number = 0.13;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private http: HttpClient,
    private toastr: ToastrService,
    private formBuilder: FormBuilder,
    private productCacheService: ProductCacheService,
  ) {
    this.editForm = this.formBuilder.group({
      int_code: [''],
      name: ['', Validators.required],
      description: ['', Validators.required],
      quantity: ['', Validators.required],
      purchase_price: ['', Validators.required],
      sale_price: ['', Validators.required],
      taxes: [false],
      taxPercentage: [0, Validators.required],
      margin: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadData();
    // this.editForm = {};
  }

  ngAfterViewInit(): void {}

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    const scrollPos =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    this.showScrollButton = scrollPos > 0;
  }

  toggleTaxes() {
    this.isTaxed = this.editForm.get('taxes').value;
    this.calculateTotal(
      this.editForm.get('purchase_price').value,
      this.editForm.get('margin').value,
      this.isTaxed,
      this.editForm.get('taxPercentage').value,
      true
    );
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
          // this.dataLoaded = true;
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
  
          this.filteredProducts = [...this.products]; // Actualizar la lista filtrada
          this.changeDetectorRef.detectChanges();
        }
      },
      error: (error) => {
        this.toastr.error('Error al obtener productos.', error);
      },
    });
  }
  
  filterProducts() {
    if (this.searchTerm === '') {
      this.filteredProducts = [...this.products];
      return;
    }
    const searchTermNormalized = this.searchTerm
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    this.filteredProducts = this.products.filter((product: any) => {
      const productNameNormalized = product.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const productCodeNormalized = product.int_code
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const searchTermLower = searchTermNormalized.toLowerCase();

      return (
        productNameNormalized.toLowerCase().includes(searchTermLower) ||
        productCodeNormalized.toLowerCase().includes(searchTermLower)
      );
    });
    this.changeDetectorRef.detectChanges();
  }

  openEditModal(int_code: string) {
    this.editProductModal.nativeElement.classList.toggle('show');
    this.editProductModal.nativeElement.style.display = 'block';

    this.http.get(`${this.backendUrl}products/int_code/${int_code}`).subscribe({
      next: (response: any) => {
        // console.log(response.message.product);
        if (
          response &&
          response.message &&
          response.message.product &&
          response.message.product.int_code &&
          response.message.product.name &&
          response.message.product.description &&
          response.message.product.quantity !== null &&
          response.message.product.quantity !== undefined &&
          response.message.product.sale_price &&
          response.message.product.margin
        ) {
          const {
            int_code,
            name,
            description,
            quantity,
            purchase_price,
            sale_price,
            taxes,
            margin,
            taxPercentage,
          } = response.message.product;

          this.editForm.patchValue({
            int_code,
            name,
            description,
            quantity,
            purchase_price,
            sale_price,
            taxes,
            margin,
            taxPercentage,
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

  editProduct() {
    const int_code = this.editForm.get('int_code').value;
    const formData = this.editForm.getRawValue();
    this.http
      .put(`${this.backendUrl}products/${int_code}`, formData)
      .subscribe({
        next: (response: any) => {
          this.toastr.success('Producto modificado exitosamente.');
          this.refreshProductList();
          this.closeEditModal();
          this.searchTerm = '';
        },
        error: (error) => {
          this.toastr.error(
            `Error al guardar la información del producto. ${error}`
          );
          console.log('Error al guardar la información del producto.', error);
        },
      });
  }

  closeEditModal() {
    this.editProductModal.nativeElement.classList.remove('show');
    this.editProductModal.nativeElement.style.display = 'none';
  }
  openAddProductModal() {
    this.addProductModal.nativeElement.classList.toggle('show');
    this.addProductModal.nativeElement.style.display = 'block';
  }

  closeAddProductModal() {
    this.addProductModal.nativeElement.classList.remove('show');
    this.addProductModal.nativeElement.style.display = 'none';
  }

  addProduct() {
    if (
      !this.newProduct.code ||
      !this.newProduct.name ||
      !this.newProduct.description ||
      !this.newProduct.purchase_price ||
      !this.newProduct.margin
    ) {
      this.toastr.warning('Se debe suministrar todos los campos.');
      return;
    }
    const data = {
      int_code: this.newProduct.code,
      name: this.newProduct.name,
      description: this.newProduct.description,
      quantity: 0,
      purchase_price: this.newProduct.purchase_price,
      sale_price: this.newProduct.sale_price,
      margin: this.newProduct.margin,
      taxes: this.newProduct.taxes,
      taxPercentage: this.newProduct.taxPercentage,
    };


    this.http.post(`${this.backendUrl}products/`, data).subscribe({
      next: (response) => {
        this.toastr.success(`Producto creado exitosamente ${data.name}.`);
        this.newProduct.code = '';
        this.newProduct.name = '';
        this.newProduct.description = '';
        this.newProduct.purchase_price = 0;
        this.newProduct.sale_price = 0;
        this.newProduct.margin = 0;
        this.newProduct.taxes = false;
        this.newProduct.taxPercentage = 0;
        this.closeAddProductModal();
        this.refreshProductList();
      },
      error: (error) => {
        this.toastr.error('Error al crear el producto');
        console.error('Error al crear el producto.', error);
      },
    });
  }

  calculateTotal(
    purchase_price: number,
    margin: number,
    taxes: boolean,
    taxPercentage: number,
    isEditForm: boolean = false
  ): void {
    // Almacenamos el valor anterior de sale_price
    const oldSalePrice = this.newProduct.sale_price; 

    if (!taxes) {
      if (!isNaN(purchase_price) && !isNaN(margin)) {
        const total = purchase_price / (1 - margin / 100);
        this.newProduct.sale_price = Number(total.toFixed(2));
        if (isEditForm && total !== oldSalePrice) {
          // Verificamos si el valor ha cambiado antes de asignarlo
          this.editForm.controls['sale_price'].setValue(total.toFixed(2));
        }
      } else {
        this.newProduct.sale_price = 0;
        if (isEditForm && oldSalePrice !== 0) {
          this.editForm.controls['sale_price'].setValue(0);
        }
      }
    } else {
      if (!isNaN(purchase_price) && !isNaN(margin)) {
        const total =
          (purchase_price / (1 - margin / 100)) / (1 - taxPercentage / 100)
        this.newProduct.sale_price = Number(total.toFixed(2));
        if (isEditForm && total !== oldSalePrice) {
          this.editForm.controls['sale_price'].setValue(total.toFixed(2));
        }
      }
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
        // console.log('Respuesta recibida del DBService', response);
        if (response.success) {
          this.toastr.success(`Producto eliminado satisfactoriamente.`);
          this.closePasswordModal();
          this.refreshProductList();
          this.searchTerm = '';
          this.password = '';
        } else {
          const errorMessage =
            response.message.error || 'Error al eliminar el producto';
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

          this.editForm.patchValue({
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
    this.newProduct[field] = Number(this.newProduct[field].toFixed(2));
  }
}
