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
import { BehaviorSubject, Subscription } from 'rxjs';
import { fadeAnimation } from 'src/app/animations/fadeAnimation';
import { Products } from 'src/app/interfaces/products';
import { ProductService } from 'src/app/services/product.service';
import { StockAuditService } from 'src/app/services/stock-audit.service';

interface ProductListStockAudit extends Products {
  real_stock?: number;
  difference?: number;
  adjustedQuantity?: number;
  adjustedAmount?: number;
}

interface AuditListProducts extends ProductListStockAudit {
  filtered?: ProductListStockAudit[];
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
  @ViewChild('auditModal', { static: false }) auditModal!: ElementRef;
  @ViewChild('deleteAuditModal', { static: false })
  deleteAuditModal!: ElementRef;
  @ViewChild('auditHistory', { static: false }) auditHistory!: ElementRef;

  filteredProducts: any[] = [];
  public products: Products[] = [];
  subscription: Subscription = new Subscription();
  page: number = 0;
  searchTerm: string = '';

  productForm: FormGroup;
  selectedProduct: Products;
  auditListProducts: ProductListStockAudit[] = [];
  auditListProducts$ = new BehaviorSubject<any[]>([]);

  categoryOptions = [
    { value: 0, label: 'Consumo interno' },
    { value: 1, label: 'Venta directa' },
  ];
  category_name: { value: number; label: string };

  fileInput: File | null = null;
  importButtonDisabled: boolean = true;
  exportButtonDisabled: Promise<Boolean>;
  allAudits: any[] = [];

  constructor(
    private productService: ProductService,
    private toastr: ToastrService,
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private audits: StockAuditService
  ) {}

  ngOnInit() {
    this.loadData();
    this.exportButtonDisabled = this.checkIfIndexedDBExists();
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

    this.getAuditListProducts();
  }

  ngAfterViewInit(): void {
    this.refreshProductList();
    this.getAllAudits();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  

  initializeIndexedDB() {
    const dbName = 'auditListDB';
    const storeName = 'products';
  
    const request = indexedDB.open(dbName);
  
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Crear el objeto de almacenamiento "products" si no existe
      db.createObjectStore(storeName, { keyPath: 'productId' });
    };
  
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
  
      // Verificar si el almacén 'products' existe
      if (!db.objectStoreNames.contains(storeName)) {
        // Si no existe, cerrar la base de datos y mostrar un mensaje
        db.close();
        const newRequest = indexedDB.open(dbName, 2);
  
        newRequest.onupgradeneeded = (event) => {
          const upgradedDb = (event.target as IDBOpenDBRequest).result;
          upgradedDb.createObjectStore(storeName, { keyPath: 'productId' });
          this.toastr.success("La lista para auditorías se ha activado satisfactoriamente.");
          this.exportButtonDisabled = this.checkIfIndexedDBExists();
        };
  
        newRequest.onsuccess = (event) => {
          const upgradedDb = (event.target as IDBOpenDBRequest).result;
          upgradedDb.close();
          console.log(`El almacén "${storeName}" ha sido creado satisfactoriamente.`);
          this.toastr.success("La lista para auditorías se ha activado satisfactoriamente.");
          console.log(`Base de datos "${dbName}" inicializada con éxito.`);
        };
  
        newRequest.onerror = (event) => {
          console.error(
            'Error al abrir la base de datos de IndexedDB.',
            event.target
          );
        };
      } else {
        // Si el almacén ya existe, simplemente cerrar la base de datos y mostrar un mensaje
        console.log(`El almacén "${storeName}" ya existe.`);
        this.toastr.success("Ya existe una lista para auditorías activa.");
        console.log(`Base de datos "${dbName}" inicializada con éxito.`);
        db.close();
      }
    };
  
    request.onerror = (event) => {
      console.error(
        'Error al abrir la base de datos de IndexedDB.',
        event.target
      );
    };
  }
  
  
  loadAuditListProducts() {
    const request = indexedDB.open('auditListDB');

    request.onsuccess = (event) => {
      const db = request.result;

      const transaction = db.transaction('products', 'readonly');
      const objectStore = transaction.objectStore('products');
      const getAllRequest = objectStore.getAll();

      getAllRequest.onsuccess = () => {
        const auditListProducts = getAllRequest.result;
        this.auditListProducts = auditListProducts;
      };
      db.close();
    };

    request.onerror = (event) => {
      console.error(
        'Error al abrir la base de datos de auditoría',
        event.target
      );
    };
  }

  checkIfIndexedDBExists(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const request = indexedDB.open('auditListDB');

      request.onsuccess = () => {
        const db = request.result as IDBDatabase;
        const objectStoreNames = db.objectStoreNames;

        if (objectStoreNames.contains('products')) {
          // La base de datos y el almacén existen
          resolve(false);
        } else {
          // La base de datos existe, pero el almacén no
          resolve(true);
        }

        db.close(); // Cerrar la base de datos después de la verificación
      };

      request.onerror = () => {
        // La base de datos no existe
        resolve(true);
      };
    });
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
      const inputElement = document.getElementById(
        'real_stock'
      ) as HTMLInputElement;
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
    const realStockValue = this.productForm.get('real_stock').value;
    const differenceValue = this.productForm.get('difference').value;
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
      this.toastr.warning('El producto ya está en la lista de auditoría.');
    } else {
      const request = indexedDB.open('auditListDB');

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'productId' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('products')) {
          this.toastr.warning('No existe auditoría activa, por favor inicialice.')
          return;
        }

        const transaction = db.transaction('products', 'readwrite');
        const objectStore = transaction.objectStore('products');

        const addRequest = objectStore.put(auditProduct);

        addRequest.onsuccess = () => {
          this.toastr.success('Producto agregado a la lista de auditoría.');
          setTimeout(() => {
            this.exportButtonDisabled = Promise.resolve(false);
          }, 50);
          this.auditListProducts$.next([...this.auditListProducts$.value, auditProduct]);
        };

        addRequest.onerror = (event) => {
          this.toastr.error(
            'Error al agregar el producto a la lista de auditoría.'
          );
          console.error(
            'Error al guardar el producto en IndexedDB',
            event.target
          );
        };
        db.close();
      };

      request.onerror = (event) => {
        this.toastr.error('Error al abrir la base de datos de IndexedDB.');
        console.error(
          'Error al abrir la base de datos de IndexedDB',
          event.target
        );
      };
    }
  }

  getAuditListProducts(callback?: (products: AuditListProducts[]) => void) {
    const request = indexedDB.open('auditListDB');
  
    request.onsuccess = (event) => {
      const db = request.result;
  
      // Verificar si el almacén 'products' existe antes de abrir la transacción
      if (!db.objectStoreNames.contains('products')) {
        console.warn('El almacén "products" no existe en la base de datos.');
        // No hagas nada si el almacén no existe
        return;
      }
  
      const transaction = db.transaction('products', 'readonly');
      const objectStore = transaction.objectStore('products');
  
      const getAllRequest = objectStore.getAll();
  
      getAllRequest.onsuccess = () => {
        const auditListProducts = getAllRequest.result;
        // Actualizar auditListProducts aquí
        this.auditListProducts = auditListProducts;
        this.auditListProducts$.next(auditListProducts);
        // callback(auditListProducts);
      };
  
      getAllRequest.onerror = (event) => {
        console.error(
          'Error al obtener la lista de productos de auditoría',
          event.target
        );
      };
      db.close();
    };
  
    request.onerror = (event) => {
      console.error(
        'Error al abrir la base de datos de auditoría',
        event.target
      );
    };
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

  calculateDifference(): void {
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
    const request = indexedDB.open('auditListDB');

    request.onsuccess = (event) => {
      const db = request.result;

      const transaction = db.transaction('products', 'readwrite');
      const objectStore = transaction.objectStore('products');

      const deleteRequest = objectStore.delete(productId);

      deleteRequest.onsuccess = () => {
        this.toastr.success('Producto eliminado de la lista de auditoría.');
        this.getAuditListProducts((auditListProducts) => {
          this.auditListProducts = auditListProducts;
          setTimeout(() => {
            this.exportButtonDisabled = Promise.resolve(true);
          }, 50);
        });
      };

      deleteRequest.onerror = (event) => {
        this.toastr.error(
          'Error al eliminar el producto de la lista de auditoría.'
        );
        console.error(
          'Error al eliminar el producto de la lista de auditoría',
          event.target
        );
      };
      db.close();
    };

    request.onerror = (event) => {
      this.toastr.error(
        'Error al abrir la base de datos de auditoría.',
        'Error'
      );
      console.error(
        'Error al abrir la base de datos de auditoría',
        event.target
      );
    };
    indexedDB.open('auditListDB');
  }

  openAuditListModal() {
    const request = indexedDB.open('auditListDB');

    request.onsuccess = (event) => {
      const db = request.result;

      const transaction = db.transaction('products', 'readonly');
      const objectStore = transaction.objectStore('products');
      const getAllRequest = objectStore.getAll();

      getAllRequest.onsuccess = () => {
        const auditListProducts = getAllRequest.result;

        if (auditListProducts.length === 0) {
          this.toastr.warning(
            'No se han agregado elementos a la lista para la auditoría.'
          );
          return;
        }

        this.auditListProducts = auditListProducts;

        this.auditModal.nativeElement.style.display = 'block';
        this.auditModal.nativeElement.classList.add('opening');
        setTimeout(() => {
          this.auditModal.nativeElement.classList.add('show');
        }, 50);
      };
      db.close();
    };

    request.onerror = (event) => {
      this.toastr.error(
        'Error al abrir la base de datos de auditoría.',
        'Error'
      );
      console.error(
        'Error al abrir la base de datos de auditoría',
        event.target
      );
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

  deleteIndexedDB() {
    const request = indexedDB.deleteDatabase('auditListDB');

    request.onsuccess = (event) => {
      console.log('La lista de auditoría ha sido eliminada con éxito.');
      this.toastr.success('La lista de auditoría ha sido eliminada con éxito..');
      setTimeout(() => {
        this.closeDeleteAuditModal();
        this.exportButtonDisabled = this.checkIfIndexedDBExists()
      }, 300);
    };

    request.onerror = (event) => {
      console.error(
        'Error al eliminar la lista de auditoría.',
        event.target
      );
      this.toastr.error('Error al eliminar la lista de auditoría.');
    };
  }

  exportToJSON() {
    const request = indexedDB.open('auditListDB');

    request.onsuccess = (event) => {
      const db = request.result;
      const transaction = db.transaction('products', 'readonly');
      const objectStore = transaction.objectStore('products');

      const getAllRequest = objectStore.getAll();

      getAllRequest.onsuccess = () => {
        const products = getAllRequest.result;

        if (products.length === 0) {
          this.toastr.info('No hay datos para exportar.');
          return;
        }

        const jsonData = JSON.stringify(products, null, 2);

        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'auditList.json';
        a.click();

        URL.revokeObjectURL(url);
      };
      db.close();
    };

    request.onerror = (event) => {
      console.error(
        'Error al abrir la base de datos de auditoría',
        event.target
      );
    };
  }

  importJSON(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.fileInput = inputElement.files[0];
    if (this.fileInput) {
      this.importButtonDisabled = false;
    } else {
      this.toastr.warning('No se seleccionó ningún archivo.');
    }
  }

  importJSONData() {
    const reader = new FileReader();
  
    reader.onload = (e) => {
      const jsonData = e.target.result as string;
      const products = JSON.parse(jsonData);
  
      const dbName = 'auditListDB';
      const storeName = 'products';
  
      // Intenta abrir la base de datos existente
      const request = indexedDB.open(dbName);
  
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
  
        // Verifica si la base de datos existe
        if (!db) {
          console.error(`La base de datos "${dbName}" no existe.`);
          this.toastr.warning(`No existe auditoría activa, por favor inicialice.`);
          db.close();
          return;
        }
  
        // Verifica si el almacén 'products' existe
        if (!db.objectStoreNames.contains(storeName)) {
          console.error(`El almacén "${storeName}" no existe.`);
          this.toastr.warning(`No existe auditoría activa, por favor inicialice.`);
          db.close();
          return;
        }
  
        // Si la base de datos y el almacén existen, puedes continuar con la carga de datos
        const transaction = db.transaction(storeName, 'readwrite');
        const objectStore = transaction.objectStore(storeName);
  
        const duplicates: Set<string> = new Set();
  
        const importPromises = products.map((product: ProductListStockAudit) => {
          return new Promise<void>((resolve) => {
            const addRequest = objectStore.add(product);
  
            addRequest.onsuccess = () => {
              console.log('Producto agregado:', product);
              resolve();
              this.getAuditListProducts(null);
              db.close();
            };
  
            addRequest.onerror = (event) => {
              console.error('Error al agregar producto:', event.target['error']);
  
              if (event.target['error']['name'] === 'ConstraintError') {
                duplicates.add(product.name);
              }
  
              resolve();
              db.close();
            };
          });
        });
  
        Promise.all(importPromises)
          .then(() => {
            if (duplicates.size > 0) {
              const message = `Hay ${duplicates.size} producto(s) que ya se encuentran en la lista de productos a auditar.`;
              this.toastr.warning(message);
            } else {
              this.toastr.success('Información importada con éxito.');
              this.fileInput = null;
              this.importButtonDisabled = true;
              setTimeout(() => {
                this.exportButtonDisabled = Promise.resolve(false);
                this.getAuditListProducts(null);
              }, 50);
            }
          })
          .catch(() => {
            this.toastr.error('Error al importar la información.');
          });
      };
  
      request.onerror = (event) => {
        console.error('Error al abrir la base de datos de auditoría', event.target['error']);
      };
    };
  
    reader.readAsText(this.fileInput);
  }
  

  getAllAudits(): void {
    this.audits.fetchAllAudits().subscribe({
      next: (response: any) => {
        this.allAudits = response?.message.documents.map((audit: any) => ({
          ...audit,
          createdAt: new Date(audit.createdAt),
          updatedAt: new Date(audit.updatedAt),
          auditProducts: audit.auditItems,
        }));
        this.allAudits.forEach((audit: any) => {
          this.calculateQuantityAndAmount(audit);
        });
      },
    });
  }

  private calculateQuantityAndAmount(audit: any): void {
    const totalQuantity = audit.auditProducts.reduce(
      (total: number, item: any) => {
        return total + parseFloat(item.adjusted_quantity);
      },
      0
    );

    const totalAmount = audit.auditProducts.reduce(
      (total: number, item: any) => {
        return total + parseFloat(item.adjusted_amount);
      },
      0
    );

    audit.totalQuantity = totalQuantity;
    audit.totalAmount = totalAmount;
  }

  convertDateToString(auditDate: any): string {
    const day = auditDate.getUTCDate();
    const month = auditDate.getUTCMonth();
    const year = auditDate.getUTCFullYear();

    return `${day < 10 ? '0' : ''}${day}-${
      month < 10 ? '0' : ''
    }${month}-${year}`;
  }

  openDeleteAuditModal() {
    this.deleteAuditModal.nativeElement.style.display = 'block';
    this.deleteAuditModal.nativeElement.classList.add('opening');
    setTimeout(() => {
      this.deleteAuditModal.nativeElement.classList.add('show');
    }, 50);
  }

  closeDeleteAuditModal() {
    this.deleteAuditModal.nativeElement.classList.add('closing');
    setTimeout(() => {
      this.deleteAuditModal.nativeElement.classList.remove('show');
      this.deleteAuditModal.nativeElement.classList.remove('closing');
      this.deleteAuditModal.nativeElement.style.display = 'none';
    }, 300);
  }

  openAuditHistoryModal() {
    this.auditHistory.nativeElement.style.display = "block";
    this.auditHistory.nativeElement.classList.add('opening');
    setTimeout(() => {
      this.auditHistory.nativeElement.classList.add('show');
    }, 50);
  }

  closeAuditHistoryModal() {
    this.auditHistory.nativeElement.classList.add('closing');
    setTimeout(() => {
      this.auditHistory.nativeElement.classList.remove('show');
      this.auditHistory.nativeElement.classList.remove('closing');
      this.auditHistory.nativeElement.style.display = 'none';
    }, 300);
  }
}
