import { style } from '@angular/animations';
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { OptionsService } from './../../services/optionsService';
import { fadeAnimation } from 'src/app/fadeAnimation';
import { environment } from 'src/environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.css'],
  animations: [fadeAnimation],
})
export class OptionsComponent implements OnInit {
  // Variables de modales
  @ViewChild('providerListModal', { static: false })
  providerListModal!: ElementRef;
  @ViewChild('providerInfoModal', { static: false })
  providerInfoModal!: ElementRef;
  @ViewChild('customerListModal', { static: false })
  customerListModal!: ElementRef;
  @ViewChild('customerInfoModal', { static: false })
  customerInfoModal!: ElementRef;

  // Variables generales
  activateRegister: boolean | any;
  editMode: boolean = false; // Funciona para Clientes y Proveedores

  backendUrl = `${environment.apiUrl}`;

  // Variables para Títulos dinámicos Modal
  modalTitle: string;
  modalActionLabel: boolean = false;

  // Variables Gestión de Clientes
  customers: any[] = [];
  filteredCustomers: any[] = [];
  searchTermCustomer: string = '';
  selectedCustomer: any;
  customerInfo: any = {};
  customerForm: FormGroup;

  // Variables Gestión de Proveedores
  providers: any[] = [];
  filteredProviders: any[] = [];
  searchTermProvider: string = '';
  selectedProvider: any;
  providerInfo: any = {};
  providerForm: FormGroup;

  constructor(
    private optionService: OptionsService,
    private toastr: ToastrService,
    private http: HttpClient,
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder
  ) {
    // Formulario gestión de clientes
    this.customerForm = this.formBuilder.group({
      customer_id: [0],
      customer_name: ['', Validators.required],
      customer_first_lastname: ['', Validators.required],
      customer_second_lastname: ['', Validators.required],
      customer_email: ['', Validators.required],
      customer_phone: ['', Validators.required],
      customer_address: ['', Validators.required],
      customer_dni: ['', Validators.required],
    });

    // Formulario gestión de proveedores
    this.providerForm = this.formBuilder.group({
      provider_id: [0],
      provider_name: ['', Validators.required],
      provider_address: ['', Validators.required],
      provider_phone: ['', Validators.required],
      provider_email: ['', Validators.required],
      provider_dni: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.optionService.getRegisterStatus().subscribe((status: boolean) => {
      this.activateRegister = status;
    });
    this.getProviderList();
    this.getCustomerList();
    this.filterCustomers();
    this.filterProviders();
  }

  saveRegisterStatus() {
    this.optionService.changeRegisterStatus(this.activateRegister).subscribe({
      next: () => {
        if (this.activateRegister) {
          this.toastr.success('Registro de usuarios activado.');
        } else {
          this.toastr.warning('Registro de usuarios desactivado.');
        }
      },
      error: () => {
        this.toastr.error('No se pudo activar el registro de usuarios.');
      },
    });
  }

  getCustomerList() {

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
        this.toastr.error('Error al obtener clientes.', error);
      },
    });
  }

  filterCustomers() {
    if (!this.searchTermCustomer || this.searchTermCustomer === '') {
      this.filteredCustomers = [...this.customers];
      return;
    }
    const searchTermNormalized = this.searchTermCustomer
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    this.filteredCustomers = this.customers.filter((customer: any) => {
      const customerNameNormalized = customer.customer_name
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

  getCustomerInfo(customer_id: number) {
    this.http.get(`${this.backendUrl}customers/id/${customer_id}`).subscribe({
      next: (response: any) => {
        if (response.message.customer) {
          const customer = response.message.customer;
          this.updateCustomerForm(customer);
          this.customerInfo = { ...customer };
          this.toastr.success('Información de cliente recuperada con éxito.');
        } else {
          this.toastr.warning('Cliente no encontrado.');
        }
      },
      error: (error: any) => {
        this.toastr.error('Error al obtener el cliente.');
      },
    });
  }
  
  private updateCustomerForm(customer: any) {
    const {
      customer_id,
      customer_name,
      customer_first_lastname,
      customer_second_lastname,
      customer_email,
      customer_phone,
      customer_address,
      customer_dni,
    } = customer;
  
    this.customerForm.patchValue({
      customer_id,
      customer_name,
      customer_first_lastname,
      customer_second_lastname,
      customer_email,
      customer_phone,
      customer_address,
      customer_dni,
    });
  }
  

  openCustomerInfoModal(value: any, customer_id: string) {
    let selectedCustomerId = null;
    if (value === true && customer_id) {
      this.modalTitle = value ? 'Edición' : 'Registro';
      this.modalActionLabel = value;
      this.changeDetectorRef.detectChanges();
      this.customerInfoModal.nativeElement.classList.add('show');
      this.customerInfoModal.nativeElement.style.display = 'block';
      selectedCustomerId = customer_id;
      setTimeout(() => {
        this.getCustomerInfo(selectedCustomerId);
      }, 300);
    } else {
      this.modalTitle = value ? 'Edición' : 'Registro';
      this.modalActionLabel = !value;
      this.changeDetectorRef.detectChanges();
      this.customerInfoModal.nativeElement.classList.add('show');
      this.customerInfoModal.nativeElement.style.display = 'block';
    }
  }

  closeCustomerInfoModal() {
    this.customerInfoModal.nativeElement.classList.remove('show');
    this.customerInfoModal.nativeElement.style.display = 'none';
    this.customerForm.reset();
    this.customerInfo = {};
  }

  openCustomerListModal() {
    this.customerListModal.nativeElement.classList.toggle('show');
    this.customerListModal.nativeElement.style.display = 'block';
  }

  closeCustomerListModal() {
    this.customerListModal.nativeElement.classList.remove('show');
    this.customerListModal.nativeElement.style.display = 'none';
  }

  createCustomer() {
    if (this.modalActionLabel) {
      if (this.customerForm.invalid) {
        this.toastr.error('Por favor, completa todos los campos requeridos.');
        return;
      }
  
      const customerData = this.extractCustomerFormData();
      this.saveCustomer(customerData);
    } else {

    }
  }
  
  private extractCustomerFormData() {
    return {
      customer_name: this.customerForm.get('customer_name').value,
      customer_first_lastname: this.customerForm.get('customer_first_lastname').value,
      customer_second_lastname: this.customerForm.get('customer_second_lastname').value,
      customer_email: this.customerForm.get('customer_email').value,
      customer_phone: this.customerForm.get('customer_phone').value,
      customer_address: this.customerForm.get('customer_address').value,
      customer_dni: this.customerForm.get('customer_dni').value,
    };
  }
  
  private saveCustomer(customerData: any) {
    this.changeDetectorRef.detectChanges();
    this.http.post(`${this.backendUrl}customers`, customerData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('Cliente guardado exitosamente.');
          this.resetCustomerForm();
          this.refreshCustomersList();
          this.closeCustomerInfoModal();
        } else {
          this.toastr.error('Error al guardar el cliente.');
        }
      },
      error: (error: any) => {
        this.toastr.error('Error al guardar el cliente.', error);
      },
    });
  }
  
  private resetCustomerForm() {
    this.customerForm.reset();
  }

  editCustomer(customerId: number) {
    if (this.customerForm.invalid) {
      this.toastr.error('Por favor, completa todos los campos requeridos.');
      return;
    }
  
    const customerData = this.extractCustomerFormData();
    this.updateCustomer(customerId, customerData);
  }
  
  private updateCustomer(customerId: number, customerData: any) {
    this.http.put(`${this.backendUrl}customers/${customerId}`, customerData)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastr.success('Cliente actualizado exitosamente.');
            this.updateLocalCustomer(customerId, customerData);
          } else {
            this.toastr.error('Error al actualizar el cliente.');
          }
          this.getCustomerList();
        },
        error: (error: any) => {
          this.toastr.error('Error al actualizar el cliente.', error);
        },
      });
  }
  
  private updateLocalCustomer(customerId: number, customerData: any) {
    this.filteredCustomers = this.customers.map((customer) => {
      if (customer.customer_id === customerId) {
        return customerData;
      }
      return customer;
    });
  }

  deleteCustomer(id: number) {
    this.http.delete(`${this.backendUrl}customers/${id}`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('Cliente eliminado exitosamente.');
          this.refreshCustomersList();
        } else {
          this.toastr.error('Error al eliminar el cliente.');
        }
      },
      error: (error: any) => {
        this.toastr.error('Error al eliminar el cliente.', error);
      },
    });
  }

  refreshCustomersList() {
    this.http.get(`${this.backendUrl}customers`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.customers = response.message?.customers;
          this.filteredCustomers = [...this.customers];
          this.toastr.success('Lista de clientes actualizada.');
        } else {
        }
      },
      error: (error: any) => {
        this.toastr.error('Error actualizando la lista de clientes.');
      },
    });
  }

  // DE AQUÍ EN ADELANTE EXCLUSIVAMENTE PROVEEDORES
  getProviderList() {
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
        this.toastr.error('Error al obtener proveedores.', error);
      },
    });
  }

  filterProviders() {
    if (!this.searchTermProvider || this.searchTermProvider === '') {
      this.filteredProviders = [...this.providers];
      return;
    }
    const searchTermNormalized = this.searchTermProvider
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    this.filteredProviders = this.providers.filter((provider: any) => {
      const providerNameNormalized = provider.provider_name
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

  getProviderInfo(provider_id: number) {
    this.http.get(`${this.backendUrl}providers/id/${provider_id}`).subscribe({
      next: (response: any) => {
        if (response.message.provider) {
          const provider = response.message.provider;
          this.updateProviderForm(provider);
          this.providerInfo = { ...provider };
          this.toastr.success('Información de proveedor recuperada con éxito.');
        } else {
          this.toastr.warning('Proveedor no encontrado.');
        }
      },
      error: (error: any) => {
        this.toastr.error('Error al obtener el proveedor.');
      },
    });
  }
  
  private updateProviderForm(provider: any) {
    const {
      provider_id,
      provider_name,
      provider_address,
      provider_email,
      provider_phone,
      provider_dni,
    } = provider;
  
    this.providerForm.patchValue({
      provider_id,
      provider_name,
      provider_address,
      provider_email,
      provider_phone,
      provider_dni,
    });
  }

  openProviderInfoModal(value: any, provider_id: string) {
    let selectedProviderId = null;
    if (value === true && provider_id) {
      this.modalTitle = value ? 'Edición' : 'Registro';
      this.modalActionLabel = value;
      this.changeDetectorRef.detectChanges();
      this.providerInfoModal.nativeElement.classList.add('show');
      this.providerInfoModal.nativeElement.style.display = 'block';
      selectedProviderId = provider_id;
      setTimeout(() => {
        this.getProviderInfo(selectedProviderId);
      }, 300);
    } else {
      this.modalTitle = value ? 'Edición' : 'Registro';
      this.modalActionLabel = !value;
      this.changeDetectorRef.detectChanges();
      this.providerInfoModal.nativeElement.classList.add('show');
      this.providerInfoModal.nativeElement.style.display = 'block';
    }
  }

  closeProviderInfoModal() {
    this.providerInfoModal.nativeElement.classList.remove('show');
    this.providerInfoModal.nativeElement.style.display = 'none';
    this.providerForm.reset();
    this.providerInfo = {};
  }

  openProviderListModal() {
    this.providerListModal.nativeElement.classList.toggle('show');
    this.providerListModal.nativeElement.style.display = 'block';
  }

  closeProviderListModal() {
    this.providerListModal.nativeElement.classList.remove('show');
    this.providerListModal.nativeElement.style.display = 'none';
  }

  createProvider() {
    if (this.modalActionLabel) {
      if (this.providerForm.invalid) {
        this.toastr.error('Por favor, completa todos los campos requeridos.');
        return;
      }
  
      const providerData = this.extractProviderFormData();
      this.saveProvider(providerData);
    } else {

    }
  }
  
  private extractProviderFormData() {
    return {
      name: this.providerForm.get('provider_name').value,
      address: this.providerForm.get('provider_address').value,
      phone: this.providerForm.get('provider_phone').value,
      email: this.providerForm.get('provider_email').value,
      provider_dni: this.providerForm.get('provider_dni').value,
    };
  }
  
  private saveProvider(providerData: any) {
    this.changeDetectorRef.detectChanges();
    this.http.post(`${this.backendUrl}providers`, providerData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('Proveedor guardado exitosamente.');
          this.resetProviderForm();
          this.refreshProvidersList();
          this.closeProviderInfoModal();
        } else {
          this.toastr.error('Error al guardar el proveedor.');
        }
      },
      error: (error: any) => {
        this.toastr.error('Error al guardar el proveedor.', error);
      },
    });
  }
  
  private resetProviderForm() {
    this.providerForm.reset();
  }

  editProvider(providerId: number) {
    if (this.providerForm.invalid) {
      this.toastr.error('Por favor, completa todos los campos requeridos.');
      return;
    }
  
    const providerData = this.extractProviderFormData();
    this.updateProvider(providerId, providerData);
  }
  
  private updateProvider(providerId: number, providerData: any) {
    this.http.put(`${this.backendUrl}providers/${providerId}`, providerData)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastr.success('Proveedor actualizado exitosamente.');
            this.updateLocalProvider(providerId, providerData);
          } else {
            this.toastr.error('Error al actualizar el proveedor.');
          }
          this.getProviderList();
        },
        error: (error: any) => {
          this.toastr.error('Error al actualizar el proveedor.', error);
        },
      });
  }
  
  private updateLocalProvider(providerId: number, providerData: any) {
    this.filteredProviders = this.providers.map((provider) => {
      if (provider.provider_id === providerId) {
        return providerData;
      }
      return provider;
    });
  }

  deleteProvider(id: number) {
    this.http.delete(`${this.backendUrl}customers/${id}`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('Proveedor eliminado exitosamente.');
          this.refreshProvidersList();
        } else {
          this.toastr.error('Error al eliminar el proveedor.');
        }
      },
      error: (error: any) => {
        this.toastr.error('Error al eliminar el proveedor.', error);
      },
    });
  }

  refreshProvidersList() {
    this.http.get(`${this.backendUrl}customers`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.providers = response.data;
          this.filteredProviders = [...this.providers];
          this.toastr.success('Lista de proveedores actualizada.');
        } else {
        }
      },
      error: (error: any) => {
        this.toastr.error('Error actualizando la lista de clientes.');
      },
    });
  }
}

