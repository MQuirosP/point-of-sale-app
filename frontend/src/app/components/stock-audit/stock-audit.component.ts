import { style } from '@angular/animations';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { fadeAnimation } from 'src/app/animations/fadeAnimation';
import { Products } from 'src/app/interfaces/products';
import { ProductService } from 'src/app/services/product.service';

interface ProductListStockAudit extends Products {
  real_stock?: number;
  difference?: number;
  adjustedQuantity?: number;
  adjustedAmount?: number;
}


@Component({
  selector: 'app-stock-audit',
  templateUrl: './stock-audit.component.html',
  styleUrls: ['./stock-audit.component.css'],
  animations: [fadeAnimation],
})


export class StockAuditComponent implements OnInit {
  @ViewChild('productInfoModal', { static: false })
  productInfoModal!: ElementRef;
  @ViewChild("auditModal", { static: false }) auditModal!: ElementRef;

  filteredProducts: any[] = [];
  public products: Products[] = [];
  subscription: Subscription = new Subscription();
  page: number = 0;
  searchTerm: string = '';

  productForm: FormGroup;
  selectedProduct: Products;
  auditListProducts: ProductListStockAudit[] = [];

  categoryOptions = [
    { value: 0, label: 'Consumo interno' },
    { value: 1, label: 'Venta directa' },
  ];
  category_name: { value: number; label: string };

  constructor(
    private productService: ProductService,
    private toastr: ToastrService,
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.loadData();
    this.productForm = this.formBuilder.group({
      productId: [0, Validators.required],
      int_code: ['', Validators.required],
      name: ['', Validators.required],
      category_id: ['', Validators.required],
      category_name: ['', Validators.required],
      quantity: [0, Validators.required],
      real_stock: [0, Validators.required],
      difference: [0, Validators.required],
    });
  }

  ngAfterViewInit(): void {
    this.refreshProductList();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  getUserRole(): string {
    return localStorage.getItem('role');
  }

  nextPage() {
    this.page += 5;
  }

  prevPage() {
    if (this.page > 0) this.page -= 5;
  }

  loadData() {
    if (this.products.length > 0) {
      return;
    }

    this.subscription = this.productService.getProducts().subscribe({
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
        this.toastr.error('Error al obtener productos.', error.error);
      },
    });
  }

  refreshProductList() {
    this.productService.getProducts().subscribe({
      next: (response: any) => {
        if (
          response &&
          response.success &&
          response.message &&
          response.message.products &&
          response.message.products.length > 0
        ) {
          this.products = response.message.products.map((product: Products) => {
            return { ...product };
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

  filterProducts(search: string) {
    this.searchTerm = search;
    this.page = 0;
    this.changeDetectorRef.detectChanges();
  }

  openProductModal(product: Products): void {
  
    this.productInfoModal.nativeElement.style.display = 'block';
    this.productInfoModal.nativeElement.classList.add('opening');
    setTimeout(() => {
      this.productInfoModal.nativeElement.classList.add('show');
      this.getProductInfo(product);
    }, 50);
    setTimeout(() => {
      const inputElement = document.getElementById('real_stock') as HTMLInputElement;
      inputElement.focus();
      this.calculateDifference();
    }, 300);
  }

  closeProductModal(): void {
    this.productInfoModal.nativeElement.classList.add('closing');
    setTimeout(() => {
      this.productInfoModal.nativeElement.classList.remove('show');
      this.productInfoModal.nativeElement.classList.remove('closing');
      this.productInfoModal.nativeElement.style.display = 'none';
    }, 300);
    this.resetStockAndDifference();
    this.selectedProduct = null;
  }

  private getProductInfo(product: Products) {
    this.productService.getProductById(product).subscribe({
      next: (response: any) => {
        if (response.message.product) {
          this.selectedProduct = response.message.product;
          this.updateProductForm(product);
          this.toastr.success('Información de producto recuperada con éxito.');
        } else {
          this.toastr.warning('Producto no encontrado.');
        }
      },
      error: (error: any) => {
        this.toastr.error('Error al obtener el producto.');
      },
    });
  }

  private updateProductForm(product: Products) {
    const selectedCategory = this.categoryOptions.find(
      (option) => option.value === product.category_id
    );

    this.productForm.patchValue({
      ...product,
      category_id: selectedCategory,
    });
    this.productForm.get('category_name').setValue(selectedCategory.label);
  }

  addProductToAuditList() {
    const purchase_price = this.selectedProduct.purchase_price;
    const realStockValue = this.productForm.get("real_stock").value;
    const differenceValue = this.productForm.get("difference").value;
    const adjustedAmountValue = differenceValue * purchase_price;
  
    const auditProduct = {
      ...this.selectedProduct,
      real_stock: realStockValue,
      difference: differenceValue,
      adjustedQuantity: differenceValue,
      adjustedAmount: adjustedAmountValue,
    };
  
    const existingProductIndex = this.auditListProducts.findIndex(
      (product) => product.productId === auditProduct.productId
    );
  
    if (existingProductIndex !== -1) {
      this.toastr.warning("El producto ya está en la lista de auditoría.");
    } else {
      // Abre o crea la base de datos
      const request = indexedDB.open("auditListDB", 1);
  
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore("products", { keyPath: "productId" });
      };
  
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
  
        const transaction = db.transaction("products", "readwrite");
        const objectStore = transaction.objectStore("products");
  
        // Guarda el producto en IndexedDB
        const addRequest = objectStore.put(auditProduct);
  
        addRequest.onsuccess = () => {
          // Mostrar mensaje de éxito con Toastr
          this.toastr.success("Producto agregado a la lista de auditoría.");
        };
  
        addRequest.onerror = (event) => {
          // Mostrar mensaje de error con Toastr
          this.toastr.error("Error al agregar el producto a la lista de auditoría.");
          console.error("Error al guardar el producto en IndexedDB", event.target);
        };
      };
  
      request.onerror = (event) => {
        // Mostrar mensaje de error con Toastr
        this.toastr.error("Error al abrir la base de datos de IndexedDB.");
        console.error("Error al abrir la base de datos de IndexedDB", event.target);
      };
  
      this.auditListProducts.push(auditProduct);
    }
  }

  getAuditListProducts(callback) {
    const request = indexedDB.open("auditListDB", 1);

    request.onsuccess = (event) => {
        const db = request.result;

        const transaction = db.transaction("products", "readonly");
        const objectStore = transaction.objectStore("products");

        const getAllRequest = objectStore.getAll();

        getAllRequest.onsuccess = () => {
            const auditListProducts = getAllRequest.result;
            callback(auditListProducts);
        };

        getAllRequest.onerror = (event) => {
            console.error("Error al obtener la lista de productos de auditoría", event.target);
        };
    };

    request.onerror = (event) => {
        console.error("Error al abrir la base de datos de auditoría", event.target);
    };
}
  
  deleteAuditListDB(productId: number) {
    const request = indexedDB.open("auditListDB", 1);
  
    request.onsuccess = (event) => {
      const db = request.result;
  
      const transaction = db.transaction("products", "readwrite");
      const objectStore = transaction.objectStore("products");
  
      const deleteRequest = objectStore.delete(productId);
  
      deleteRequest.onsuccess = () => {
        this.toastr.success("Producto eliminado de la lista de auditoría.");
        this.getAuditListProducts(this.getAuditListProducts);
      };
  
      deleteRequest.onerror = (event) => {
        this.toastr.error("Error al eliminar el producto de la lista de auditoría.");
        console.error("Error al eliminar el producto de la lista de auditoría", event.target);
      };
    };
  
    request.onerror = (event) => {
      this.toastr.error("Error al abrir la base de datos de auditoría.", "Error");
      console.error("Error al abrir la base de datos de auditoría", event.target);
    };
    this.getAuditListProducts(productId);
  }
  
  resetStockAndDifference(): void {
    this.productForm.get('real_stock').setValue(0);
    this.productForm.get('difference').setValue(0);

    const inputElement = document.getElementById(
      'real_stock'
    ) as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
  }

  calculateDifference() {
    let difference = 0;
    const systemStock = this.productForm.get('quantity').value;
    const realStock = this.productForm.get('real_stock').value;

    if (systemStock !== realStock) {
      difference = realStock - systemStock;
      this.productForm.get('difference').setValue(difference);
    } else {
      difference = 0;
      this.productForm.get('difference').setValue(difference);
    }
  }

  deleteAuditProduct(productId: number) {
    const request = indexedDB.open("auditListDB", 1);
  
    request.onsuccess = (event) => {
      const db = request.result;
  
      const transaction = db.transaction("products", "readwrite");
      const objectStore = transaction.objectStore("products");
  
      const deleteRequest = objectStore.delete(productId);
  
      deleteRequest.onsuccess = () => {
        this.toastr.success("Producto eliminado de la lista de auditoría.");
        this.getAuditListProducts((auditListProducts) => {
          this.auditListProducts = auditListProducts;
        });
      };
  
      deleteRequest.onerror = (event) => {
        this.toastr.error("Error al eliminar el producto de la lista de auditoría.");
        console.error("Error al eliminar el producto de la lista de auditoría", event.target);
      };
    };
  
    request.onerror = (event) => {
      this.toastr.error("Error al abrir la base de datos de auditoría.", "Error");
      console.error("Error al abrir la base de datos de auditoría", event.target);
    }
  }
  

  openAuditListModal() {
    const request = indexedDB.open("auditListDB", 1);
  
    request.onsuccess = (event) => {
      const db = request.result;
  
      const transaction = db.transaction("products", "readonly");
      const objectStore = transaction.objectStore("products");
  
      const countRequest = objectStore.count();
  
      countRequest.onsuccess = () => {
        const count = countRequest.result;
  
        if (count === 0) {
          this.toastr.info("No se han agregado elementos a la lista para la auditoría.");
          return;
        }
  
        this.auditModal.nativeElement.style.display = 'block';
        this.auditModal.nativeElement.classList.add('opening');
        setTimeout(() => {
          this.auditModal.nativeElement.classList.add('show');
        }, 50);
      };
    };
  
    request.onerror = (event) => {
      this.toastr.error("Error al abrir la base de datos de auditoría.", "Error");
      console.error("Error al abrir la base de datos de auditoría", event.target);
    };
  }
  

  closeAuditListModal() {
    this.auditModal.nativeElement.classList.add('closing');
    setTimeout(() => {
      this.auditModal.nativeElement.classList.remove('show');
      this.auditModal.nativeElement.classList.remove('closing');
      this.auditModal.nativeElement.style.display = 'none';
    }, 300);
  }
}
