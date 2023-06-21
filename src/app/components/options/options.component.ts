import { map } from 'rxjs';
import { style } from '@angular/animations';
import { OptionsService } from './../../services/optionsService';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { fadeAnimation } from 'src/app/fadeAnimation';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.css'],
  animations: [fadeAnimation],
})
export class OptionsComponent implements OnInit {
  @ViewChild('providerModal', { static: false })
  providerModal!: ElementRef;
  @ViewChild('customerModal', { static: false }) 
  customerModal!: ElementRef;

  activateRegister: boolean | any;

  backendUrl = `${environment.apiUrl}`

  providers: any[] = [];
  filteredProviders: any[] = [];
  searchTermProvider: string = '';
  customers: any[] = [];
  filteredCustomers: any[] = [];
  searchTermCustomer: string = '';

  constructor(
    private optionService: OptionsService,
    private toastr: ToastrService,
    private http: HttpClient,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.optionService.getRegisterStatus().subscribe((status: boolean) => {
      this.activateRegister = status;
    });
    this.getProviderList();
  }

  saveRegisterStatus() {
    this.optionService.changeRegisterStatus(this.activateRegister).subscribe({
      next: () => {
        if (this.activateRegister) {
          this.toastr.success('Registro de usuarios activado');
        } else {
          this.toastr.warning('Registro de usuarios desactivado');
        }
      },
      error: () => {
        this.toastr.error('No se pudo activar el registro de usuarios');
      },
    });
  }


  
  openProviderMainteinanceModal() {
    this.providerModal.nativeElement.classList.toggle('show');
    this.providerModal.nativeElement.style.display = 'block';
  }

  closeProviderMainteinanceModal() {
    this.providerModal.nativeElement.classList.remove('show');
    this.providerModal.nativeElement.style.display = 'none';
  }

  openCustomerMainteinanceModal() {
    this.customerModal.nativeElement.classList.toggle('show');
    this.customerModal.nativeElement.style.display = 'block';
  }

  closeCustomerMainteinanceModal() {
    this.customerModal.nativeElement.classList.remove('show');
    this.customerModal.nativeElement.style.display = 'none';
  }

  getProviderList() {

    if ( this.providers.length > 0 ) {
      return;
    }
    
    this.http.get(`${this.backendUrl}providers`).subscribe({
      next: (response: any) => {
        if (
          response.success &&
          response.message.providers.length > 0
        ) {
          this.providers = response.message.providers.map((provider: any) => {
            return { ...provider, showIcons: false}
          });
        }
        this.filteredProviders = [...this.providers];
        // console.log(this.providers);
      },
      error: (error) => {
        this.toastr.error('Error al obtener proveedores', error)
      }
    })
  }

  filterProviders() {
    if ( this.searchTermProvider === '' ) {
      this.filteredProviders = [...this.providers];
      return;
    }
    const searchTermNormalized = this.searchTermProvider
    .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    this.filteredProviders = this.providers.filter((provider: any) => {
      const providerNameNormalized = provider.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
        
        const providerDniNormalized = provider.provider_dni
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const searchTermLower = searchTermNormalized.toLowerCase();

      return (
        providerNameNormalized.toLowerCase().includes(searchTermLower) ||
        providerDniNormalized.toLowerCase().includes(searchTermLower)
        );
    });
    this.changeDetectorRef.detectChanges();
  }

  getCustomerList() {

    if ( this.providers.length > 0 ) {
      return;
    }
    
    this.http.get(`${this.backendUrl}customers`).subscribe({
      next: (response: any) => {
        if (
          response.success &&
          response.message.providers.length > 0
        ) {
          this.customers = response.message.customers.map((customer: any) => {
            return { ...customer, showIcons: false}
          });
        }
        this.filteredCustomers = [...this.customers];
        // console.log(this.providers);
      },
      error: (error) => {
        this.toastr.error('Error al obtener clientes', error)
      }
    })
  }

  filterCustomers() {
    if ( this.searchTermCustomer === '' ) {
      this.filteredProviders = [...this.providers];
      return;
    }
    const searchTermNormalized = this.searchTermCustomer
    .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    this.filteredCustomers = this.customers.filter((customer: any) => {
      const providerNameNormalized = customer.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
        
        const providerDniNormalized = customer.customer_dni
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const searchTermLower = searchTermNormalized.toLowerCase();

      return (
        providerNameNormalized.toLowerCase().includes(searchTermLower) ||
        providerDniNormalized.toLowerCase().includes(searchTermLower)
        );
    });
    this.changeDetectorRef.detectChanges();
  }
}
