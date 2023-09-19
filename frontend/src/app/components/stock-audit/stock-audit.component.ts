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
    this.exportButtonDisabled = this.isIndexedDBEmpty();
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
    this.getAllAudits();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  initializeIndexedDB() {
    // Verificar si la base de datos ya existe
    indexedDB.databases().then((databaseList) => {
      const exists = databaseList.some(
        (dbInfo) => dbInfo.name === 'auditListDB'
      );

      if (!exists) {
        // La base de datos no existe, proceder a crearla
        const request = indexedDB.open('auditListDB', 1);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          // Crear el objeto de almacenamiento "products"
          const productsStore = db.createObjectStore('products', {
            keyPath: 'productId',
          });
          // Puedes agregar índices o realizar otras configuraciones aquí si es necesario.
        };

        request.onsuccess = (event) => {
          // La base de datos se abrió exitosamente, no necesitas realizar ninguna operación aquí.
          this.toastr.success('Auditoría inicializada exitosamente.');
        };

        request.onerror = (event) => {
          console.error(
            'Error al abrir la base de datos de IndexedDB.',
            event.target
          );
          this.toastr.error('Error al abrir la base de datos de IndexedDB.');
        };
      } else {
        // La base de datos ya existe, mostrar un mensaje de advertencia
        console.warn('La base de datos de IndexedDB ya existe.');
        this.toastr.warning('La base de datos de IndexedDB ya está iniciada.');
      }
    });
  }

  loadAuditListProducts() {
    const request = indexedDB.open('auditListDB', 1);

    request.onsuccess = (event) => {
      const db = request.result;

      const transaction = db.transaction('products', 'readonly');
      const objectStore = transaction.objectStore('products');
      const getAllRequest = objectStore.getAll();

      getAllRequest.onsuccess = () => {
        const auditListProducts = getAllRequest.result;
        this.auditListProducts = auditListProducts;
      };
    };

    request.onerror = (event) => {
      console.error(
        'Error al abrir la base de datos de auditoría',
        event.target
      );
    };
  }

  isIndexedDBEmpty(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const request = indexedDB.open('auditListDB', 1);
  
      request.onsuccess = () => {
        const db = (request.result as IDBDatabase);
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
      const request = indexedDB.open('auditListDB', 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'productId' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        const transaction = db.transaction('products', 'readwrite');
        const objectStore = transaction.objectStore('products');

        const addRequest = objectStore.put(auditProduct);

        addRequest.onsuccess = () => {
          this.toastr.success('Producto agregado a la lista de auditoría.');
          setTimeout(() => {
            this.exportButtonDisabled = Promise.resolve(false);
          }, 50);
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

  getAuditListProducts(callback: (products: AuditListProducts[]) => void) {
    const request = indexedDB.open('auditListDB', 1);

    request.onsuccess = (event) => {
      const db = request.result;

      const transaction = db.transaction('products', 'readonly');
      const objectStore = transaction.objectStore('products');

      const getAllRequest = objectStore.getAll();

      getAllRequest.onsuccess = () => {
        const auditListProducts = getAllRequest.result;
        callback(auditListProducts);
      };

      getAllRequest.onerror = (event) => {
        console.error(
          'Error al obtener la lista de productos de auditoría',
          event.target
        );
      };
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
    const request = indexedDB.open('auditListDB', 1);

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

  openAuditListModal() {
    const request = indexedDB.open('auditListDB', 1);

    request.onsuccess = (event) => {
      const db = request.result;

      const transaction = db.transaction('products', 'readonly');
      const objectStore = transaction.objectStore('products');
      const getAllRequest = objectStore.getAll();

      getAllRequest.onsuccess = () => {
        const auditListProducts = getAllRequest.result;

        if (auditListProducts.length === 0) {
          this.toastr.info(
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
    const confirmation = window.confirm(
      '¿Estás seguro de que deseas eliminar la base de datos? Esto eliminará todos los datos almacenados en ella.'
    );

    if (confirmation) {
      const request = indexedDB.deleteDatabase('auditListDB');

      request.onsuccess = (event) => {
        console.log('Base de datos eliminada con éxito.');
        this.toastr.success('Base de datos eliminada con éxito.');
      };

      request.onerror = (event) => {
        console.error(
          'Error al eliminar la base de datos de IndexedDB.',
          event.target
        );
        this.toastr.error('Error al eliminar la base de datos de IndexedDB.');
      };
    }
  }

  exportToJSON() {
    const request = indexedDB.open('auditListDB', 1);

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

      // Obtener la lista de bases de datos existentes
      indexedDB.databases().then((databaseList) => {
        const hasAuditListDB = databaseList.some(
          (dbInfo) => dbInfo.name === 'auditListDB'
        );

        if (!hasAuditListDB) {
          // Si 'auditListDB' no existe, mostrar un mensaje de advertencia
          this.toastr.warning(
            'No se ha inicializado una auditoría. Por favor, inicialice una auditoría primero.'
          );
          // Puedes realizar acciones adicionales, como deshabilitar el botón de importación
          return;
        }

        const request = indexedDB.open('auditListDB', 1);

        request.onsuccess = (event) => {
          const db = request.result;
          const transaction = db.transaction('products', 'readwrite');
          const objectStore = transaction.objectStore('products');

          const duplicates: Set<string> = new Set();

          const importPromises = products.map(
            (product: ProductListStockAudit) => {
              return new Promise<void>((resolve, reject) => {
                const addRequest = objectStore.add(product);

                addRequest.onsuccess = () => {
                  console.log('Producto agregado:', product);
                  resolve();
                };

                addRequest.onerror = (event) => {
                  console.error(
                    'Error al agregar producto:',
                    (event.target as IDBRequest).error
                  );

                  // Check if the error is due to a unique constraint violation
                  if (
                    (event.target as IDBRequest).error.name ===
                    'ConstraintError'
                  ) {
                    duplicates.add(product.name);
                  }

                  resolve(); // Resolve instead of rejecting to continue importing other products
                };
              });
            }
          );

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
                }, 50);
              }
            })
            .catch(() => {
              this.toastr.error('Error al importar la información.');
            });
        };

        request.onerror = (event) => {
          console.error(
            'Error al abrir la base de datos de auditoría',
            event.target
          );
        };
      });
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
}
