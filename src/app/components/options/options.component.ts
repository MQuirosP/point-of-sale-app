import { style } from '@angular/animations';
import { OptionsService } from './../../services/optionsService';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { fadeAnimation } from 'src/app/fadeAnimation';
import { environment } from 'src/environments/environment';

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

  providersList: any[] = [];
  customersList: any[] = [];
  searchTermProvider: any[] = [];
  searchTermCustomer: any[] = [];

  constructor(
    private optionService: OptionsService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.optionService.getRegisterStatus().subscribe((status: boolean) => {
      this.activateRegister = status;
    });
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

  filterProviders() {}

  filterCustomers() {}

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

  }
}
