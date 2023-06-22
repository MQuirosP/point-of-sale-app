import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { OptionsService } from './../../services/optionsService';
import { fadeAnimation } from 'src/app/fadeAnimation';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.css'],
  animations: [fadeAnimation]
})
export class OptionsComponent implements OnInit {
  @ViewChild('providerListModal', { static: false }) providerListModal!: ElementRef;
  @ViewChild('customerListModal', { static: false }) customerListModal!: ElementRef;
  @ViewChild('customerInfoModal', { static: false }) customerInfoModal!: ElementRef;

  activateRegister: boolean | any;

  backendUrl = `${environment.apiUrl}`;

  providers: any[] = [];
  filteredProviders: any[] = [];
  searchTermProvider: string = '';

  customers: any[] = [];
  filteredCustomers: any[] = [];
  searchTermCustomer: string = '';
  selectedCustomer: any;
  
  modalTitle: string;
  modalActionLabel: boolean = false;
  customerInfo: any = {};

  constructor(
    private optionService: OptionsService,
    private toastr: ToastrService,
    private http: HttpClient,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.optionService.getRegisterStatus().subscribe((status: boolean) => {
      this.activateRegister = status;
    });
    // this.getProviderList();
    // this.filterCustomers();
    // this.getCustomerList();
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
      }
    });
  }

  getProviderList() {
    if (this.providers.length > 0) {
      return;
    }

    this.http.get(`${this.backendUrl}providers`).subscribe({
      next: (response: any) => {
        if (response.success && response.message.providers.length > 0) {
          this.providers = response.message.providers.map((provider: any) => {
            return { ...provider, showIcons: false };
          });
        }
        this.filteredProviders = [...this.providers];
      },
      error: (error) => {
        this.toastr.error('Error al obtener proveedores', error);
      }
    });
  }

  filterProviders() {
    if (this.searchTermProvider === '') {
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
    if (this.customers.length > 0) {
      return;
    }

    this.http.get(`${this.backendUrl}customers`).subscribe({
      next: (response: any) => {
        if (response.success && response.message.customers.length > 0) {
          this.customers = response.message.customers.map((customer: any) => {
            return { ...customer, showIcons: false };
          });
        }
        this.filteredCustomers = [...this.customers];
      },
      error: (error) => {
        this.toastr.error('Error al obtener clientes', error);
      }
    });
  }

  filterCustomers() {
    if (this.searchTermCustomer === '') {
      this.filteredCustomers = [...this.customers];
      return;
    }
    const searchTermNormalized = this.searchTermCustomer
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    this.filteredCustomers = this.customers.filter((customer: any) => {
      const customerNameNormalized = customer.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const customerDniNormalized = customer.customer_dni
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const searchTermLower = searchTermNormalized.toLowerCase();

      return (
        customerNameNormalized.toLowerCase().includes(searchTermLower) ||
        customerDniNormalized.toLowerCase().includes(searchTermLower)
      );
    });
    this.changeDetectorRef.detectChanges();
  }

  getCustomerInfo(id: number) {
    const customer = this.customers.find((customer) => customer.customer_id === id);
    if (customer) {
      this.customerInfo = { ...customer };
      this.toastr.success('Información de cliente recuperada con éxito');
    } else {
      this.toastr.error('No se encontró información del cliente');
    }
  }

  openCustomerInfoModal(value, id = null) {
    if (value && id) {
      this.getCustomerInfo(id);
    }
  
    this.modalTitle = value ? 'Editar cliente' : 'Registrar cliente';
    this.modalActionLabel = value;
    this.changeDetectorRef.detectChanges();
  
    setTimeout(() => {
      this.customerInfoModal.nativeElement.classList.add('show');
      this.customerInfoModal.nativeElement.style.display = 'block';
    }, 1000);
  }

  closeCustomerInfoModal() {
    this.customerInfoModal.nativeElement.classList.remove('show');
    this.customerInfoModal.nativeElement.style.display = 'none';
    this.customerInfo = {};
  }

  saveCustomerInfo() {
    if (!this.modalActionLabel) {
      if (
        !this.customerInfo.name &&
        !this.customerInfo.first_lastname &&
        !this.customerInfo.second_lastname &&
        !this.customerInfo.customer_dni
      ) {
        this.toastr.error('Se debe suministrar todos los campos');
      }
      const customerData = {
        name: this.customerInfo.name,
        first_lastname: this.customerInfo.first_lastname,
        second_lastname: this.customerInfo.second_lastname,
        customer_dni: this.customerInfo.customer_dni,
        phone: this.customerInfo.phone,
        email: this.customerInfo.email,
        address: this.customerInfo.address
      };
      this.http.post(`${this.backendUrl}customers`, customerData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastr.success('Cliente guardado exitosamente');
            this.customerInfo = {};
            this.refreshCustomersList();
            this.closeCustomerInfoModal();
          } else {
            this.toastr.error('Error al guardar el cliente');
          }
        },
        error: (error: any) => {
          this.toastr.error('Error al guardar el cliente', error);
        }
      });
    } else {
      const customerData = {
        customer_id: this.customerInfo.customer_id,
        name: this.customerInfo.name,
        first_lastname: this.customerInfo.first_lastname,
        second_lastname: this.customerInfo.second_lastname,
        customer_dni: this.customerInfo.customer_dni,
        phone: this.customerInfo.phone,
        email: this.customerInfo.email,
        address: this.customerInfo.address
      };
      this.http.put(`${this.backendUrl}customers/${customerData.customer_id}`, customerData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastr.success('Cliente actualizado exitosamente');
            this.refreshCustomersList();
            this.customerInfo = {};
            this.closeCustomerInfoModal();
          } else {
            this.toastr.error('Error al actualizar el cliente');
          }
        },
        error: (error: any) => {
          this.toastr.error('Error al actualizar el cliente', error);
        }
      });
    }
  }

  deleteCustomer(id: number) {
    this.http.delete(`${this.backendUrl}customers/${id}`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('Cliente eliminado exitosamente');
          this.refreshCustomersList();
        } else {
          this.toastr.error('Error al eliminar el cliente');
        }
      },
      error: (error: any) => {
        this.toastr.error('Error al eliminar el cliente', error);
      }
    });
  }

  refreshCustomersList() {
    this.getCustomerList();
    this.filteredCustomers = [...this.customers];
    this.searchTermCustomer = '';
    this.changeDetectorRef.detectChanges();
  }
}
