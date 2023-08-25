import { style } from '@angular/animations';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { fadeAnimation } from 'src/app/animations/fadeAnimation';
import { Products } from 'src/app/interfaces/products';
import { ProductService } from 'src/app/services/product.service';

@Component({
  selector: 'app-stock-audit',
  templateUrl: './stock-audit.component.html',
  styleUrls: ['./stock-audit.component.css'],
  animations: [fadeAnimation],
})
export class StockAuditComponent implements OnInit {

  @ViewChild("productInfoModal", { static: false }) productInfoModal!: ElementRef;

  filteredProducts: any[] = [];
  public products: Products[] = [];
  subscription: Subscription = new Subscription();
  page: number = 0;
  searchTerm: string = '';

  productForm: FormGroup;

  categoryOptions = [
    { value: 0, label: 'Consumo interno' },
    { value: 1, label: 'Venta directa' },
  ];
  category_name: { value: number; label: string; };

  constructor(
    private productService: ProductService,
    private toastr: ToastrService,
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
  ) { }

  ngOnInit() {
    this.loadData();
    this.productForm = this.formBuilder.group({
      productId: [0, Validators.required],
      int_code: ['', Validators.required],
      name: ["", Validators.required],
      category_id: ["", Validators.required],
      category_name: ["", Validators.required],
      quantity: [0, Validators.required],
      real_stock: [0, Validators.required],
      difference: [0, Validators.required],
    })
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
    this.productInfoModal.nativeElement.style.display = "block";
    this.productInfoModal.nativeElement.classList.add('opening');
    setTimeout(() => {
      this.productInfoModal.nativeElement.classList.add('show');
    }, 50);
    setTimeout(() => {
      this.getProductInfo(product);
    })
  }

  closeProductModal(): void {
    this.productInfoModal.nativeElement.classList.add('closing');
    setTimeout(() => {
      this.productInfoModal.nativeElement.classList.remove('show');
      this.productInfoModal.nativeElement.classList.remove('closing');
      this.productInfoModal.nativeElement.style.display = 'none';
    }, 300);
    this.resetRealStock();
  }

  getProductInfo(product: Products) {
    this.productService.getProductById(product).subscribe({
      next: (response: any) => {
        if(response.message.product) {
          this.updateProductForm(product);
          this.toastr.success('Información de producto recuperada con éxito.')
        } else {
          this.toastr.warning("Producto no encontrado.")
        }
      },
      error: (error: any) => {
        this.toastr.error('Error al obtener el producto.')
      }
    })
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

  saveChanges() {

  }

  resetRealStock(): void {
    this.productForm.get('real_stock').setValue(0);

    const inputElement = document.getElementById('real_stock') as HTMLInputElement
    if (inputElement) {
      inputElement.focus()
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
      this.toastr.warning('Las cantidades son iguales.')
    }
  }
}
