import { OptionsService } from './../../services/optionsService';
import { Component } from '@angular/core';
import { fadeAnimation } from 'src/app/fadeAnimation';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.css'],
  animations: [fadeAnimation],
})
export class OptionsComponent {
  activateRegister: boolean | any;

  constructor(private optionService: OptionsService) {}

  ngOnInit() {
    this.optionService.getRegisterStatus().subscribe((status: boolean) => {
      this.activateRegister = status;
    });
  }

  saveRegisterStatus() {
    this.optionService.changeRegisterStatus(this.activateRegister).subscribe({
      next: () => {
        if(this.activateRegister) {
          alert('Registro de usuarios activado');
        } else {
          alert('Registro de usuarios desactivado')
        }
      },
      error: () => {
        alert('No se pudo activar el registro de usuarios');
      },
    });
  }
}