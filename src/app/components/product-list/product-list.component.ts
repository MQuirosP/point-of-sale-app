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

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  animations: [fadeAnimation]
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

  editForm: any = {};

  newProduct: {
    code: string;
    name: string;
    description: string;
    purchasePrice: number;
    margin: number;
    salePrice: number;
  } = {
    code: '',
    name: '',
    description: '',
    purchasePrice: 0,
    margin: 0,
    salePrice: 0,
  };

  password: string = '';

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private http: HttpClient,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.editForm = {};
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
        console.log('Error al obtener productos', error);
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
        console.log('Error al obtener productos', error);
      },
    });
  }

  compare(a: string, b: string): number {
    const normalizedA = a.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normalizedB = b.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalizedA.localeCompare(normalizedB);
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
        .replace(/[\u0300-\u036f]/g, '')

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
          response.message.product.sale_price
        ) {
          const {
            int_code,
            name,
            description,
            quantity,
            purchase_price,
            sale_price,
          } = response.message.product;

          this.editForm.int_code = int_code;
          this.editForm.name = name;
          this.editForm.description = description;
          this.editForm.quantity = quantity;
          this.editForm.purchase_price = purchase_price;
          this.editForm.sale_price = sale_price;
        } else {
          console.log('No se encontró el producto');
          this.toastr.warning('Producto no encontrado')
        }
      },
      error: (error) => {
        console.log('Error al obtener el producto', error);
        this.toastr.error('Error al obtener el producto')
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

  saveProduct() {
    const { int_code } = this.editForm;
    this.http
      .put(`${this.backendUrl}products/${int_code}`, this.editForm)
      .subscribe({
        next: (response: any) => {
          this.toastr.success('Producto modificado exitosamente');
          this.updateProductList(this.editForm);
          this.closeEditModal();
          this.searchTerm = '';
        },
        error: (error) => {
          this.toastr.error(`Error al guardar la información del producto ${error}`)
          console.log('Error al guardar la información del producto', error);
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
    const data = {
      int_code: this.newProduct.code,
      name: this.newProduct.name,
      description: this.newProduct.description,
      quantity: 0,
      purchase_price: this.newProduct.purchasePrice,
      sale_price: this.newProduct.salePrice,
    };

    this.http.post(`${this.backendUrl}products/`, data).subscribe({
      next: (response) => {
        // Manejar la respuesta exitosa del servidor aquí
        this.toastr.success(`Producto creado exitosamente ${data.name}`);
        this.closeAddProductModal();
        this.refreshProductList();
      },
      error: (error) => {
        // Manejar el error en caso de que la solicitud no sea exitosa
        console.error('Error al crear el producto', error);
      },
    });
  }

  calculateTotal() {
    const purchasePrice = this.newProduct.purchasePrice;
    const margin = this.newProduct.margin;

    if (!isNaN(purchasePrice) && !isNaN(margin)) {
      const total = purchasePrice + (purchasePrice * margin) / 100;
      this.newProduct.salePrice = total;
    } else {
      this.newProduct.salePrice = 0;
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
        console.log('Respuesta recibida del DBService', response);
        if (response.success) {
          this.toastr.success(`Producto eliminado satisfactoriamente`);
          this.closePasswordModal();
          this.refreshProductList();
          this.searchTerm = '';
        } else {
          const errorMessage =
            response.message || 'Error al eliminar el producto';
          this.toastr.error(errorMessage);
        }
      },
      error: (error: any) => {
        console.error('Error al eliminar el producto:', error);
        this.toastr.error('Error al eliminar el producto: ' + error.message);
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

          this.editForm.int_code = int_code;
          this.editForm.name = name;
          this.editForm.description = description;
          this.editForm.quantity = quantity;
          this.editForm.sale_price = sale_price;
        } else {
          console.log('No se encontró el producto');
          this.toastr.warning('Producto no encontrado')
        }
      },
      error: (error) => {
        console.log('Error al obtener el producto', error);
        this.toastr.error('Error al obtener el producto')
      },
    });
  }

  closePasswordModal() {
    this.deletePasswordModal.nativeElement.classList.remove('show');
    this.deletePasswordModal.nativeElement.style.display = 'none';
  }
}