import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { OptionsService } from '../../services/optionsService';
import { fadeAnimation } from 'src/app/animations/fadeAnimation';
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
  @ViewChild('usersListModal', { static: false })
  usersListModal!: ElementRef;
  @ViewChild('usersInfoModal', { static: false })
  usersInfoModal!: ElementRef;
  @ViewChild('resetPasswordModal', { static: false })
  resetPasswordModal!: ElementRef;

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

  // Variables Gestion de Usuarios
  users: any[] = [];
  filteredUsers: any[] = [];
  searchTermUser: string = '';
  selectedUser: any;
  userInfo: any = {};
  userForm: FormGroup;
  resetPasswordForm: FormGroup;
  superUser: string = 'admin';

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

    this.userForm = this.formBuilder.group({
      userId: [0],
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      username: ['', Validators.required],
      email: [''],
      role: ['user', Validators.required],
      status: ['pending', Validators.required],
    });

    this.resetPasswordForm = this.formBuilder.group({
      newPassword: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.optionService.fetchRegisterStatus().subscribe((status: boolean) => {
      this.activateRegister = status;
      this.changeDetectorRef.detectChanges();
    });
    
  }
  
  ngAfterViewInit() {
    // Trasladamos la llamada de las listas a la apertura del respectivo Modal
    // this.getProviderList();
    // this.getCustomerList();
    // this.getUserList();
    // Eliminamos las llamadas a los filtros, se trasladan a sus respectivos métodos en el html
    // this.filterCustomers();
    // this.filterProviders();
    // this.filterUsers();
  }

  getUserRole(): string {
    return localStorage.getItem('role');
  }

  getUser(): string {
    return localStorage.getItem('username');
  }

  getStatusStyles(status: string) {
    switch (status) {
      case 'active':
        return { color: 'green' };
      case 'pending':
        return { color: 'blue' };
      case 'suspended':
        return { color: 'red' };
      default:
        return {};
    }
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

  toggleCheckbox() {
    this.activateRegister = !this.activateRegister;
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

  openCustomerInfoModal(value: any, customer: any) {
    let customer_id = customer.customer_id;
    if (value === true && customer_id) {
      this.modalTitle = value ? 'Edición' : 'Registro';
      this.modalActionLabel = value;
      this.changeDetectorRef.detectChanges();
      this.customerInfoModal.nativeElement.style.display = 'block';
      this.customerInfoModal.nativeElement.classList.add('opening', 'modal-background');
      setTimeout(() => {
        this.customerInfoModal.nativeElement.classList.add('show');
        this.getCustomerInfo(customer_id);
        this.toggleIcons(customer)
      }, 50);
    } else {
      this.modalTitle = value ? 'Edición' : 'Registro';
      this.modalActionLabel = !value;
      this.changeDetectorRef.detectChanges();
      this.customerInfoModal.nativeElement.style.display = 'block';
      this.customerInfoModal.nativeElement.classList.add('opening', 'modal-background');
      setTimeout(() => {
        this.customerInfoModal.nativeElement.classList.add('show');
      }, 50);
    }
  }

  closeCustomerInfoModal() {
    this.customerInfoModal.nativeElement.classList.add('closing')
    setTimeout(() => {
      this.customerInfoModal.nativeElement.classList.remove('show');
      this.customerInfoModal.nativeElement.classList.remove('closing');
      this.customerInfoModal.nativeElement.style.display = 'none';
      this.customerForm.reset();
    }, 300);
    this.customerInfo = {};
  }

  openCustomerListModal() {
    this.getCustomerList();
    this.customerListModal.nativeElement.style.display = 'block';
    this.customerListModal.nativeElement.classList.add('opening');
    setTimeout(() => {
      this.customerListModal.nativeElement.classList.add('show');
    }, 50);
  }

  closeCustomerListModal() {
    this.customerListModal.nativeElement.classList.add('closing');
    setTimeout(() => {
      this.customerListModal.nativeElement.classList.remove('show');
      this.customerListModal.nativeElement.classList.remove('closing');
      this.customerListModal.nativeElement.style.display = 'none';
    }, 300);
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
      customer_first_lastname: this.customerForm.get('customer_first_lastname')
        .value,
      customer_second_lastname: this.customerForm.get(
        'customer_second_lastname'
      ).value,
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
    this.http
      .put(`${this.backendUrl}customers/${customerId}`, customerData)
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
          this.customers = response.message?.customers.map((customer: any) => {
            return { ...customer, showIcons: false };
          });
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

  openProviderInfoModal(value: any, provider: any) {
    let provider_id = provider.provider_id;
    if (value === true && provider_id) {
      this.modalTitle = value ? 'Edición' : 'Registro';
      this.modalActionLabel = value;
      this.changeDetectorRef.detectChanges();
      this.providerInfoModal.nativeElement.style.display = 'block';
      this.providerInfoModal.nativeElement.classList.add('opening', 'modal-background');
      setTimeout(() => {
        this.providerInfoModal.nativeElement.classList.add('show');
        this.getProviderInfo(provider_id);
        this.toggleIcons(provider)
      }, 50);
    } else {
      this.modalTitle = value ? 'Edición' : 'Registro';
      this.modalActionLabel = !value;
      this.changeDetectorRef.detectChanges();
      this.providerInfoModal.nativeElement.style.display = 'block';
      this.providerInfoModal.nativeElement.classList.add('opening', 'modal-background');
      setTimeout(() => {
        this.providerInfoModal.nativeElement.classList.add('show');
      }, 50);
    }
  }

  closeProviderInfoModal() {
    this.providerInfoModal.nativeElement.classList.add('closing');
    setTimeout(() => {
      this.providerInfoModal.nativeElement.classList.remove('show');
      this.providerInfoModal.nativeElement.classList.remove('closing');
      this.providerInfoModal.nativeElement.style.display = 'none';
      this.providerForm.reset();
    }, 300);
    this.providerInfo = {};
  }

  openProviderListModal() {
    this.getProviderList();
    this.providerListModal.nativeElement.style.display = 'block';
    this.providerListModal.nativeElement.classList.add('opening');
    setTimeout(() => {
      this.providerListModal.nativeElement.classList.add('show');
    }, 50);
  }

  closeProviderListModal() {
    this.providerListModal.nativeElement.classList.add('closing');
    setTimeout(() => {
      this.providerListModal.nativeElement.classList.remove('show');
      this.providerListModal.nativeElement.classList.remove('closing');
      this.providerListModal.nativeElement.style.display = 'none';
    }, 300);
  }

  toggleIcons(object: any) {
    object.showIcons = !object.showIcons;
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
      provider_name: this.providerForm.get('provider_name').value,
      provider_address: this.providerForm.get('provider_address').value,
      provider_phone: this.providerForm.get('provider_phone').value,
      provider_email: this.providerForm.get('provider_email').value,
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
  this.http
    .put(`${this.backendUrl}providers/${providerId}`, providerData)
    .subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showSuccessNotification('Proveedor actualizado exitosamente.');
          this.updateLocalProvider(providerId, providerData);
        } else {
          this.showErrorNotification('Error al actualizar el proveedor.');
        }
        this.getProviderList();
      },
      error: (error: any) => {
        this.showErrorNotification('Error al actualizar el proveedor.', error);
      },
    });
}

private showSuccessNotification(message: string) {
  // Use Angular's built-in mechanism for showing success notifications
  this.toastr.success(message);
}

private showErrorNotification(message: string, error?: any) {
  // Use Angular's built-in mechanism for showing error notifications
  this.toastr.error(message, error);
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
    this.http.delete(`${this.backendUrl}providers/${id}`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('Proveedor eliminado exitosamente.');
        } else {
          this.toastr.error('Error al eliminar el proveedor.');
        }
        this.refreshProvidersList();
      },
      error: (error: any) => {
        this.toastr.error('Error al eliminar el proveedor.', error);
      },
    });
  }

  refreshProvidersList() {
    this.http.get(`${this.backendUrl}providers`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.providers = response.message.providers.map((provider: any) => {
            return { ...provider, showIcons: false };
          });
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

  // DE AQUÍ EN ADELANTE EXCLUSIVAMENTE USUARIOS
  openUsersListModal() {
    this.getUserList();
    this.usersListModal.nativeElement.style.display = 'block';
    this.usersListModal.nativeElement.classList.add('opening');
    setTimeout(() => {
      this.usersListModal.nativeElement.classList.add('show');
    }, 50);
  }

  closeUsersListModal() {
    this.usersListModal.nativeElement.classList.add('closing');
    setTimeout(() => {
      this.usersListModal.nativeElement.classList.remove('show');
      this.usersListModal.nativeElement.classList.remove('closing');
      this.usersListModal.nativeElement.style.display = 'none';
    }, 300);
  }

  openUserInfoModal(value: any, user: any) {
    let user_id = user.userId;
    if (value === true && user_id) {
      this.modalTitle = value ? 'Edición' : 'Registro';
      this.modalActionLabel = value;
      this.changeDetectorRef.detectChanges();
      this.usersInfoModal.nativeElement.style.display = 'block';
      this.usersInfoModal.nativeElement.classList.add('opening', 'modal-background');
      setTimeout(() => {
        this.usersInfoModal.nativeElement.classList.add('show');
      }, 50);
      setTimeout(() => {
        this.getUserInfo(user);
      }, 300);
    } else {
      this.modalTitle = value ? 'Edición' : 'Registro';
      this.modalActionLabel = !value;
      this.changeDetectorRef.detectChanges();
      this.usersInfoModal.nativeElement.style.display = 'block';
      this.usersInfoModal.nativeElement.classList.add('opening', 'modal-background');
      setTimeout(() => {
        this.usersInfoModal.nativeElement.classList.add('show');
      }, 50);
    }
  }

  closeUserInfoModal() {
    this.usersInfoModal.nativeElement.classList.add('closing');
    setTimeout(() => {
      this.usersInfoModal.nativeElement.classList.remove('show');
      this.usersInfoModal.nativeElement.classList.remove('closing');
      this.usersInfoModal.nativeElement.style.display = 'none';
    }, 300);
    this.userForm.reset();
    this.userInfo = {};
  }

  getUserList() {
    this.http.get(`${this.backendUrl}users`).subscribe({
      next: (response: any) => {
        if (response.success && response.message.Users) {
          this.users = response.message.Users.map((user: any) => {
            return { ...user, showIcons: false };
          });
        }
        this.filteredUsers = [...this.users];
      },
      error: (error) => {
        this.toastr.error('Error al obtener usuarios.', error);
      },
    });
  }

  filterUsers() {
    if (!this.searchTermUser || this.searchTermUser === '') {
      this.filteredUsers = [...this.users];
      return;
    }
    const searchTermNormalized = this.searchTermUser
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    this.filteredUsers = this.users.filter((user: any) => {
      const userNameNormalized = user.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const userLastnameNormalized = user.lastname
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const searchTermLower = searchTermNormalized.toLowerCase();

      return (
        userNameNormalized.toLowerCase().includes(searchTermLower) ||
        userLastnameNormalized.toLowerCase().includes(searchTermLower)
      );
    });
    this.changeDetectorRef.detectChanges();
  }

  getUserInfo(user: any) {
    const user_id = user.userId;
    this.http.get(`${this.backendUrl}users/id/${user_id}`).subscribe({
      next: (response: any) => {
        if (response.message.User) {
          const user = response.message.User;
          user.name = this.capitalizeFirstLetter(user.name);
          user.lastname = this.capitalizeFirstLetter(user.lastname);
          this.updateUserForm(user);
          this.userInfo = { ...user };
          this.toastr.success('Información de usuario recuperada con éxito.');
        } else {
          this.toastr.warning('Usuario no encontrado.');
        }
      },
      error: (error: any) => {
        this.toastr.error('Error al obtener el usuario.');
      },
    });
  }

  capitalizeFirstLetter(value: string): string {
    if (value && value.length > 0) {
      const names = value.split(' ');
      const capitalizedNames = names.map((n) => {
        return n.charAt(0).toUpperCase() + n.slice(1);
      });
      return capitalizedNames.join(' ');
    }
    return value;
  }

  private updateUserForm(user: any) {
    const { userId, name, lastname, username, email, role, status } = user;

    this.userForm.patchValue({
      userId,
      name,
      lastname,
      username,
      email,
      role,
      status,
    });
  }

  createUser() {
    if (this.modalActionLabel) {
      if (this.userForm.invalid) {
        this.toastr.error('Por favor, completa todos los campos requeridos.');
        return;
      }

      const userData = this.extractUserFormData();
      this.saveUser(userData);
    } else {
    }
  }

  private extractUserFormData() {
    return {
      name: this.userForm.get('name').value,
      lastname: this.userForm.get('lastname').value,
      username: this.userForm.get('username').value,
      email: this.userForm.get('email').value,
      role: this.userForm.get('role').value,
      status: this.userForm.get('status').value,
    };
  }

  private saveUser(userData: any) {
    this.changeDetectorRef.detectChanges();
    this.http.post(`${this.backendUrl}users`, userData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('Usuario guardado exitosamente.');
          this.resetUserForm();
          this.refreshUsersList();
          this.closeUserInfoModal();
        } else {
          this.toastr.error('Error al guardar el usuario.');
        }
      },
      error: (error: any) => {
        this.toastr.error('Error al guardar el usuario.', error);
      },
    });
  }

  private resetUserForm() {
    this.userForm.reset();
  }

  editUser(userId: number) {
    if (this.userForm.invalid) {
      this.toastr.error('Por favor, completa todos los campos requeridos.');
      return;
    }

    const userData = this.extractUserFormData();
    this.updateUser(userId, userData);
  }

  private updateUser(userId: number, userData: any) {
    this.http.get(`${this.backendUrl}users/id/${userId}`).subscribe({
      next: (response: any) => {
        if (response.message.User.username === this.superUser) {
          this.toastr.warning('Usuario administrador no puede ser modificado.');
          return;
        } else {
          this.http
            .put(`${this.backendUrl}users/${userId}`, userData)
            .subscribe({
              next: (response: any) => {
                if (response.success) {
                  this.toastr.success('Usuario actualizado exitosamente.');
                  this.updateLocalUser(userId, userData);
                } else {
                  this.toastr.error('Error al actualizar el usuario.');
                }
                this.refreshUsersList();
              },
              error: (error: any) => {
                this.toastr.error('Error al actualizar el usuario.', error);
              },
            });
        }
      },
      error: (error: any) => {
        this.toastr.error('Error al intentar recuperar el usuario.');
      },
    });
  }

  private updateLocalUser(userId: number, userData: any) {
    this.filteredUsers = this.users.map((user) => {
      if (user.userId === userId) {
        return userData;
      }
      return user;
    });
  }

  deleteUser(id: number) {
    this.http.get(`${this.backendUrl}users/id/${id}`).subscribe({
      next: (response: any) => {
        console.log(response);
        if (response.message.User.username === this.superUser) {
          this.toastr.warning('Usuario administrador no puede ser eliminado.');
          return;
        } else {
          this.http.delete(`${this.backendUrl}users/${id}`).subscribe({
            next: (response: any) => {
              if (response.success) {
                this.toastr.success('Usuario eliminado exitosamente.');
              } else {
                this.toastr.error('Error al eliminar el usuario.');
              }
              this.refreshUsersList();
            },
            error: (error: any) => {
              this.toastr.error('Error al eliminar el usuario.', error);
            },
          });
        }
      },
      error: (error: any) => {
        this.toastr.error('Error al recuperar el usuario');
      },
    });
  }

  refreshUsersList() {
    this.http.get(`${this.backendUrl}users`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.users = response.message.Users.map((user: any) => {
            return { ...user, showIcons: false };
          });
          this.filteredUsers = [...this.users];
          // this.toastr.success('Lista de usuarios actualizada.');
        } else {
        }
      },
      error: (error: any) => {
        this.toastr.error('Error actualizando la lista de usuarios.');
      },
    });
  }

  openResetPasswordModal() {
    this.resetPasswordModal.nativeElement.style.display = 'block';
    this.resetPasswordModal.nativeElement.classList.add('opening');
    setTimeout(() => {
      this.resetPasswordModal.nativeElement.classList.add('show');
    }, 50);
  }

  closeResetPasswordModal() {
    this.resetPasswordModal.nativeElement.classList.add('closing');
    setTimeout(() => {
      this.resetPasswordModal.nativeElement.classList.remove('show');
      this.resetPasswordModal.nativeElement.classList.remove('closing');
      this.resetPasswordModal.nativeElement.style.display = 'none';
    }, 300);
  }

  resetPassword(username: string) {
    console.log(username);
    if (username === this.superUser) {
      this.toastr.warning(
        `No tiene permisos para cambiar la contraseña al usuario.`
      );
      return;
    } else {
      if (this.resetPasswordForm.valid) {
        const newPassword = this.resetPasswordForm.get('newPassword').value;
        const confirmPassword =
          this.resetPasswordForm.get('confirmPassword').value;

        if (newPassword !== confirmPassword) {
          this.toastr.error('Las contraseñas no coinciden.');
          return;
        }

        const passwordData = { newPassword: newPassword };

        this.http
          .put(
            `${this.backendUrl}users/reset-password/${username}`,
            passwordData
          )
          .subscribe({
            next: (response: any) => {
              if (response.success) {
                this.toastr.success('Cambio de contraseña exitoso.');
                this.resetPasswordForm.reset();
                setTimeout(() => {
                  const modal = document.getElementById('resetPasswordModal');
                  if (modal) {
                    modal.classList.remove('show');
                    modal.setAttribute('aria-hidden', 'true');
                    modal.style.display = 'none';
                    const modalBackdrop =
                      document.getElementsByClassName('modal')[0];
                    if (modalBackdrop) {
                      modalBackdrop.parentNode.removeChild(modalBackdrop);
                    }
                  }
                }, 500);
                this.closeResetPasswordModal();
              } else {
                this.toastr.error('No fue posible cambiar la contraseña.');
              }
            },
            error: (error: any) => {
              this.toastr.error('Error al contactar con el servidor', error);
            },
          });
      } else {
        // Marcar los campos del formulario como tocados para mostrar los estilos de error
        this.resetPasswordForm.markAllAsTouched();
      }
    }
  }
}
