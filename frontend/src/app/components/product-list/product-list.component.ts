import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { Subscription, catchError, tap, timer } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { fadeAnimation } from 'src/app/animations/fadeAnimation';
import { ToastrService } from 'ngx-toastr';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Products } from 'src/app/interfaces/products';
import { ProductService } from 'src/app/services/product.service';

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
  @ViewChild('codeInput') codeInput: ElementRef;
  @ViewChild('nameInput') nameInput: ElementRef;

  subscription: Subscription = new Subscription();

  public products: any[] = [];
  public page: number = 0;

  filteredProducts: any[] = [];
  searchTerm: string = '';

  productForm: FormGroup;
  modalTitle: string;
  modalActionLabel: boolean = false;
  editMode: boolean = false;
  productInfo: Products;

  password: string = '';

  categoryOptions = [
    { value: 0, label: 'Consumo interno' },
    { value: 1, label: 'Venta directa' },
  ];

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private toastr: ToastrService,
    private formBuilder: FormBuilder,
    private productService: ProductService
  ) {
    this.productForm = this.formBuilder.group({
      productId: [0],
      int_code: [''],
      name: ['', Validators.required],
      description: ['', Validators.required],
      category_id: ['', [Validators.required]],
      purchase_price: ['', Validators.required],
      sale_price: ['', Validators.required],
      taxes: [false],
      taxPercentage: new FormControl(
        { value: null, disabled: true },
        Validators.required
      ),
      margin: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadData();
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

  toggleTaxPercentage() {
    const taxPercentageControl = this.productForm.get('taxPercentage');

    if (this.productForm.get('taxes').value) {
      taxPercentageControl?.enable();
    } else {
      taxPercentageControl?.disable();
      taxPercentageControl?.setValue(0);
    }
  }

  getTaxPercentageValue() {
    return this.productForm.get('taxes').value
      ? this.productForm.get('taxPercentage').value
      : 0;
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

  filterProducts(search: string) {
    this.searchTerm = search;
    this.page = 0;
    this.changeDetectorRef.detectChanges();
  }

  openProductModal(value: boolean, product: Products) {
    if (value && product) {
      this.modalTitle = value ? 'Edición' : 'Registro';
      this.modalActionLabel = value;
      this.changeDetectorRef.detectChanges();
      this.productModal.nativeElement.style.display = 'block';
      this.productModal.nativeElement.classList.add('opening');
      setTimeout(() => {
        this.productModal.nativeElement.classList.add('show');
        this.toggleIcons(product);
      }, 50);
      setTimeout(() => {
        this.getProductInfo(product);
      }, 400);
    } else {
      this.modalTitle = value ? 'Edición' : 'Registro';
      this.modalActionLabel = !value;
      this.productForm.reset();
      this.changeDetectorRef.detectChanges();
      this.productModal.nativeElement.style.display = 'block';
      this.productModal.nativeElement.classList.add('opening');
      setTimeout(() => {
        this.productModal.nativeElement.classList.add('show');
      }, 50);
    }
  }

  closeProductModal() {
    this.productModal.nativeElement.classList.add('closing');
    setTimeout(() => {
      this.productModal.nativeElement.classList.remove('show');
      this.productModal.nativeElement.classList.remove('closing');
      this.productModal.nativeElement.style.display = 'none';
    }, 300);
    this.searchTerm = '';
    this.productInfo = null;
  }

  getProductInfo(product: Products) {
    this.productInfo = null;
    this.productService.getProductById(product).subscribe({
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

  compareCategories(category1: any, category2: any): boolean {
    return category1 && category2
      ? category1.value === category2.value
      : category1 === category2;
  }

  toggleIcons(product: any) {
    product.showIcons = !product.showIcons;
  }

  private updateProductForm(product: Products) {
    const selectedCategory = this.categoryOptions.find(
      (option) => option.value === product.category_id
    );

    this.productForm.patchValue({
      ...product,
      category_id: selectedCategory,
    });
  }

  editProduct() {
    const controls = this.productForm.controls;

    for (const field in controls) {
      if (controls[field].invalid) {
        let errorMessage = 'El campo es inválido.';

        if (field === 'name') {
          errorMessage = 'El campo Nombre es inválido.';
        } else if (field === 'description') {
          errorMessage = 'El campo Descripción es inválido.';
        } else if (field === 'category_id') {
          errorMessage = 'El campo Categoría es inválido.';
        } else if (field === 'purchase_price') {
          errorMessage = 'El campo Precio de Compra es inválido.';
        } else if (field === 'sale_price') {
          errorMessage = 'El campo Precio de Venta es inválido.';
        } else if (field === 'margin') {
          errorMessage = 'El campo Margen es inválido.';
        }

        this.toastr.error(errorMessage);
        return;
      }
    }
    const productData: Products = this.extractProductFormData();
    this.updateProduct(productData);
  }

  private updateProduct(productData: Products) {
    const productId = productData.productId;

    let category = this.productForm.get('category_id').value;
    if (typeof category === 'number') {
      productData.category_id = category;
    } else {
      productData.category_id = category.value;
    }

    const propertiesChanged = Object.keys(productData).some((key) => {
      return productData[key] !== this.productInfo[key];
    });

    if (!propertiesChanged) {
      this.toastr.info('No se realizó cambios en la información del producto.');
      return;
    }

    this.productService.updateProduct(productId, productData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('Producto actualizado exitosamente.');
          this.updateLocalProduct(productId, productData);
        } else {
          this.toastr.error('Error al actualizar el producto.');
        }
        this.refreshProductList();
        this.productInfo = null;
      },
      error: (error: any) => {
        this.toastr.error('Error al actualizar el producto.', error);
      }
    });

    this.resetProductForm();
    this.closeProductModal();
  }

  private updateLocalProduct(productId: number, productData: Products) {
    this.filteredProducts = this.products.map((product) => {
      if (product.producId === productId) {
        return productData;
      }
      return product;
    });
  }

  updateProductList(updatedProduct: Products) {
    const index = this.products.findIndex(
      (product) => product.int_code === updatedProduct.int_code
    );
    if (index !== -1) {
      this.products[index] = { ...this.products[index], ...updatedProduct };
      this.filteredProducts = [...this.products];
    }
    this.loadData();
  }

  createProduct(event: Event) {
    if (this.productForm.invalid) {
      event.stopPropagation();
      this.toastr.error('Por favor, completa todos los campos requeridos.');
      return;
    }

    const productData: Products = this.extractProductFormData();
    const productIntCode = productData.int_code;

    this.productService.getProductByIntCode(productIntCode).subscribe({
      next: (response: any) => {
        if (response.success === true) {
          this.toastr.error(
            'Código de producto ya existe en la base de datos.'
          );
        } else if (response.success === false) {
          this.saveProduct(productData);
        }
      },
      error: (error: any) => {
        this.toastr.error('No se pudo verificar el producto.');
      },
    });
  }

  private extractProductFormData() {
    const formValues = this.productForm.value;
    return {
      productId: formValues.productId,
      int_code: formValues.int_code,
      name: formValues.name,
      description: formValues.description,
      category_id: formValues.category_id,
      purchase_price: formValues.purchase_price,
      sale_price: formValues.sale_price,
      taxes: formValues.taxes,
      margin: formValues.margin,
      taxPercentage: this.productForm.get('taxPercentage').value,
    };
  }

  private saveProduct(productData: Products) {
    this.changeDetectorRef.detectChanges();

    this.productService.saveProduct(productData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('Producto guardado exitosamente.');
          this.resetProductForm();
          this.refreshProductList();
          this.closeProductModal();
        } else {
          this.toastr.error('Error al guardar el producto.');
        }
      },
      error: (error: any) => {
        this.toastr.error('Error al guardar el nuevo producto.', error);
      },
    });
  }

  private resetProductForm() {
    this.productForm.reset();
  }

  calculateTotal(isEditForm: boolean = false): void {
    const purchasePriceControl = this.productForm.get('purchase_price');
    const marginControl = this.productForm.get('margin');
    const taxesControl = this.productForm.get('taxes');
    const taxPercentageControl = this.productForm.get('taxPercentage');
    const salePriceControl = this.productForm.get('sale_price');

    const oldSalePrice = salePriceControl.value;

    const recalculate = () => {
      const purchasePrice = purchasePriceControl.value;
      const margin = marginControl.value;
      const taxes = taxesControl.value;
      const taxPercentage = taxPercentageControl.value;

      if (!taxes) {
        if (!isNaN(purchasePrice) && !isNaN(margin) && margin >= 0) {
          const total = purchasePrice / (1 - margin / 100);
          if (!isNaN(total) && total !== Infinity) {
            salePriceControl.setValue(Number(total.toFixed(2)));

            if (isEditForm && total !== oldSalePrice) {
              salePriceControl.setValue(parseFloat(total.toFixed(2)));
            }
          } else {
            salePriceControl.setValue(0);
          }
        } else {
          salePriceControl.setValue(0);
        }
      } else {
        if (
          !isNaN(purchasePrice) &&
          !isNaN(margin) &&
          margin >= 0 &&
          !isNaN(taxPercentage) &&
          taxPercentage >= 0
        ) {
          const total =
            purchasePrice / (1 - margin / 100) / (1 - taxPercentage / 100);
          if (!isNaN(total) && total !== Infinity) {
            salePriceControl.setValue(Number(total.toFixed(2)));

            if (isEditForm && total !== oldSalePrice) {
              salePriceControl.setValue(parseFloat(total.toFixed(2)));
            }
          } else {
            salePriceControl.setValue(0);
          }
        } else {
          salePriceControl.setValue(0);
        }
      }
    };

    purchasePriceControl.valueChanges.subscribe(recalculate);
    marginControl.valueChanges.subscribe(recalculate);
    taxesControl.valueChanges.subscribe(recalculate);
    taxPercentageControl.valueChanges.subscribe(recalculate);

    recalculate();
  }

  deleteProduct(intCode: string) {
    const password = this.password;

    this.productService.deleteProduct(intCode, password).subscribe({
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

  openPasswordModal(product: Products) {
    this.deletePasswordModal.nativeElement.style.display = 'block';
    this.deletePasswordModal.nativeElement.classList.add('opening');
    setTimeout(() => {
      this.deletePasswordModal.nativeElement.classList.add('show');
    }, 50);
    this.toggleIcons(product);
    try {
      const { int_code, name, description, quantity, sale_price } = product;

      this.productForm.patchValue({
        int_code,
        name,
        description,
        quantity,
        sale_price,
      });
    } catch (error) {
      this.toastr.error('No se pudo recuperar la información del producto.');
    }
  }

  closePasswordModal() {
    this.deletePasswordModal.nativeElement.classList.add('closing');
    setTimeout(() => {
      this.deletePasswordModal.nativeElement.classList.remove('show');
      this.deletePasswordModal.nativeElement.classList.remove('closing');
      this.deletePasswordModal.nativeElement.style.display = 'none';
    }, 300);
  }

  limitDecimals(field: string): void {
    const fieldValue = this.productForm.value[field];
    this.productForm.patchValue({ [field]: Number(fieldValue.toFixed(2)) });
  }

  handleCodeInput(target: EventTarget | null) {
    const code = (target as HTMLInputElement)?.value;
    const expectedCodeLength = 20;

    if (code && code.length === expectedCodeLength) {
      this.nameInput.nativeElement.focus();
    }
  }
}
