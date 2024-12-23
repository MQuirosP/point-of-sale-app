import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { fadeAnimation } from 'src/app/animations/fadeAnimation';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

  public products: Products[] = [];
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
  productToDelete: Products = {};

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private toastr: ToastrService,
    private formBuilder: FormBuilder,
    private productService: ProductService
  ) {
    this.productForm = this.formBuilder.group({
      productId: [Number(0)],
      int_code: [''],
      name: ['', Validators.required],
      description: ['', Validators.required],
      category_id: [Number(''), Validators.required],
      purchase_price: [Number(0), Validators.required],
      sale_price: [Number(0), Validators.required],
      taxes: [Boolean(false), Validators.required],
      taxPercentage: [
        { value: Number(null), disabled: true },
        Validators.required,
      ],
      margin: [Number(0), Validators.required],
    });
    this.productForm.get('taxes').valueChanges.subscribe((taxesValue) => {
      if (taxesValue) {
        this.productForm.get('taxPercentage').enable();
      } else {
        this.productForm.get('taxPercentage').disable();
      }
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
    const taxesValue = this.productForm.get('taxes')?.value;

    if (taxesValue) {
      taxPercentageControl?.disable();
      taxPercentageControl?.setValue(0);
    } else {
      taxPercentageControl?.enable();
      if (this.editMode) {
        taxPercentageControl?.setValue(
          parseFloat((this.productInfo.taxPercentage || 0).toString()).toFixed(
            2
          )
        );
      } else {
        taxPercentageControl?.setValue('0.00');
      }
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
        const productsArray = response?.message?.products;

        if (
          productsArray &&
          Array.isArray(productsArray) &&
          productsArray.length > 0
        ) {
          this.products = productsArray.map((product: any) => {
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
    this.productForm.get('taxes').setValue(value);
    if (value && product) {
      this.modalTitle = value ? 'Edición' : 'Registro';
      // this.modalActionLabel = value;
      // this.changeDetectorRef.detectChanges();
      this.productModal.nativeElement.style.display = 'block';
      this.productModal.nativeElement.classList.add('opening');
      setTimeout(() => {
        this.productModal.nativeElement.classList.add('show');
      }, 50);
      setTimeout(() => {
        this.getProductInfo(product);
      }, 400);
      this.toggleIcons(product);
    } else {
      this.modalTitle = value ? 'Edición' : 'Registro';
      // this.modalActionLabel = !value;
      this.productForm.reset();
      // this.changeDetectorRef.detectChanges();
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
          const regularizedProduct = this.validateProductDataTypes(product);
          this.updateProductForm(regularizedProduct);
          this.productInfo = { ...regularizedProduct };
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

  // compareCategories(category1: any, category2: any): boolean {
  //   return category1 && category2
  //     ? category1.value === category2.value
  //     : category1 === category2;
  // }

  toggleIcons(product: Products) {
    product.showIcons = !product.showIcons;
  }

  private updateProductForm(product: Products) {
    // Convierte los campos numéricos a números explícitamente antes de pasarlos al formulario
    const formattedProduct = {
      ...product,
      purchase_price: Number(product.purchase_price).toFixed(2),
      sale_price: Number(product.sale_price).toFixed(2),
      margin: Number(product.margin).toFixed(2),
      taxPercentage: Number(product.taxPercentage).toFixed(2),
      quantity: Number(product.quantity).toFixed(3),
      category_id: Number(product.category_id),
    };

    this.productForm.patchValue({
      ...formattedProduct,
      // Si necesitas un valor específico en category_id, puedes agregarlo aquí
      // category_id: selectedCategory,
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
    const productData: Products = this.validateProductDataTypes(
      this.extractProductFormData()
    );
    this.updateProduct(productData);
  }

  private arePropertiesChanged(newData: Products, oldData: Products): boolean {
    // newData = this.validateProductDataTypes(newData);
    // oldData = this.validateProductDataTypes(oldData);
    if (!newData || !oldData) {
      return false;
    }

    return Object.keys(newData).some((key) => newData[key] !== oldData[key]);
  }

  private updateProduct(productData: Products) {
    const productId = productData.productId;
    productData = this.validateProductDataTypes(productData);
    this.productInfo = this.validateProductDataTypes(this.productInfo);
    const propertiesChanged = this.arePropertiesChanged(
      productData,
      this.productInfo
    );
    if (!propertiesChanged) {
      this.toastr.info(
        'No se realizaron cambios en la información del producto.'
      );
      return;
    }
    this.productService.updateProduct(productId, productData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('Producto actualizado exitosamente.');
          // this.updateLocalProduct(productId, productData);
        } else {
          this.toastr.error('Error al actualizar el producto.');
        }
        this.updateProductList(productData);
        this.productInfo = null;
      },
      error: (error: any) => {
        this.toastr.error('Error al actualizar el producto.', error);
      },
    });
    if (!this.editMode) {
      this.resetProductForm();
    }
    this.closeProductModal();
  }

  // private updateLocalProduct(productId: number, productData: Products) {
  //   this.filteredProducts = this.products.map((product) => {
  //     if (product.productId === productId) {
  //       return productData;
  //     }
  //     return product;
  //   }) as Products[];
  // }

  updateProductList(updatedProduct: Products): void {
    const index = this.products.findIndex(
      (product) => product.int_code === updatedProduct.int_code
    );
    if (index !== -1) {
      this.products[index] = { ...this.products[index], ...updatedProduct };
      this.filteredProducts = [...this.products];
    }
    this.loadData();
  }

  createProduct(event: Event): void {
    if (this.productForm.invalid) {
      event.stopPropagation();
      this.toastr.error('Por favor, completa todos los campos requeridos.');
      return;
    }

    const productData: Products = this.extractProductFormData();
    const int_code = productData.int_code;

    this.productService.getProductByIntCode(int_code).subscribe({
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
    return formValues;
  }

  private saveProduct(productData: Products) {
    this.changeDetectorRef.detectChanges();

    this.productService.saveProduct(productData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('Producto guardado exitosamente.');
          this.resetProductForm();
          this.productInfo = null;
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

  public resetProductForm() {
    const formData = this.extractProductFormData();
    const propertiesChanged = this.arePropertiesChanged(
      this.validateProductDataTypes(formData),
      this.validateProductDataTypes(this.productInfo)
    );

    if (this.editMode && propertiesChanged) {
      this.productForm.reset();
      this.validateProductDataTypes(this.productInfo);
      setTimeout(() => {
        this.updateProductForm(this.productInfo);
        this.toastr.success(
          'Los cambios realizados fueron descartados. Información del producto recuperada con éxito'
        );
      }, 200);
    } else if (!propertiesChanged && this.editMode) {
      this.toastr.info(
        'No se realizaron cambios en la información del producto.'
      );
      return;
    } else {
      this.productForm.reset();
    }
  }

  public calculateTotal(isEditForm: boolean = false): void {
    const controls = [
      'purchase_price',
      'margin',
      'taxes',
      'taxPercentage',
      'sale_price',
    ];

    const recalculate = () => {
      const values = controls.map(
        (controlName) => this.productForm.get(controlName).value
      );

      const [purchasePrice, margin, taxes, taxPercentage, oldSalePrice] =
        values;

      if (!taxes) {
        if (!isNaN(purchasePrice) && !isNaN(margin) && margin >= 0) {
          let total = purchasePrice / (1 - margin / 100);
          total = !isNaN(total) && total !== Infinity ? total : 0;
          this.setSalePrice(total, isEditForm, oldSalePrice);
        } else {
          this.setSalePrice(0);
        }
      } else {
        if (
          !isNaN(purchasePrice) &&
          !isNaN(margin) &&
          margin >= 0 &&
          !isNaN(taxPercentage) &&
          taxPercentage >= 0
        ) {
          let total =
            purchasePrice / (1 - margin / 100) / (1 - taxPercentage / 100);
          total = !isNaN(total) && total !== Infinity ? total : 0;
          this.setSalePrice(total, isEditForm, oldSalePrice);
        } else {
          this.setSalePrice(0);
        }
      }
    };

    controls
      .slice(0, -1)
      .forEach((controlName) =>
        this.productForm.get(controlName).valueChanges.subscribe(recalculate)
      );

    recalculate();
  }

  private setSalePrice(
    value: number,
    isEditForm: boolean = false,
    oldSalePrice?: number
  ): void {
    const salePriceControl = this.productForm.get('sale_price');
    salePriceControl.setValue(Number(value.toFixed(2)));

    if (isEditForm && value !== oldSalePrice) {
      salePriceControl.setValue(value.toFixed());
    }
  }

  deleteProduct(productData: Products) {
    const password = this.password;
    const int_code = productData.int_code;

    this.productService.deleteProduct(int_code, password).subscribe({
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
    this.productToDelete = product;
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
  validateProductDataTypes(product: Products): Products {
    return {
      ...product,
      purchase_price: product.purchase_price ? Number(product.purchase_price) : 0,
      sale_price: product.sale_price ? Number(product.sale_price) : 0,
      price: product.price ? Number(product.price) : 0,
      quantity: product.quantity ? Number(product.quantity) : 0,
      taxes_amount: product.taxes_amount ? Number(product.taxes_amount) : 0,
      sub_total: product.sub_total ? Number(product.sub_total) : 0,
      total: product.total ? Number(product.total) : 0,
      taxPercentage: product.taxPercentage ? Number(product.taxPercentage) : 0,
      margin: product.margin ? Number(product.margin) : 0,
    };
  }
}
