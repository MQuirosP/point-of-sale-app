import { OptionsService } from './../../services/optionsService';
import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { fadeAnimation } from 'src/app/fadeAnimation';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.css'],
  animations: [fadeAnimation],
})
export class OptionsComponent {
  activateRegister: boolean | any;

  constructor(
    private optionService: OptionsService,
    private toastr: ToastrService,
    ) {}

  ngOnInit() {
    this.optionService.getRegisterStatus().subscribe((status: boolean) => {
      this.activateRegister = status;
    });
  }

  saveRegisterStatus() {
    this.optionService.changeRegisterStatus(this.activateRegister).subscribe({
      next: () => {
        if(this.activateRegister) {
          this.toastr.success('Registro de usuarios activado');
        } else {
          this.toastr.warning('Registro de usuarios desactivado')
        }
      },
      error: () => {
        this.toastr.error('No se pudo activar el registro de usuarios');
      },
    });
  }
}