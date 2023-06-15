import { Component } from '@angular/core';

@Component({
  selector: 'app-digital-watch',
  templateUrl: './digital-watch.component.html',
  styleUrls: ['./digital-watch.component.css']
})
export class DigitalWatchComponent {
  hora: string = '';
  fecha: string = '';

  constructor() {
    this.mostrarReloj();
  }

  ngOnInit() {
    this.mostrarReloj();
  }

  mostrarReloj() {
    const windowWidth = window.innerWidth;
    const breakpoint = 80;
    const fecha = new Date();
    const hr = this.formatoHora(fecha.getHours());
    const min = this.formatoHora(fecha.getMinutes());
    const seg = this.formatoHora(fecha.getSeconds());
    if (windowWidth <= window.screen.width * (breakpoint / 100)) {
      this.hora = `${hr}:${min}`;
    } else {
      this.hora = `${hr}:${min}:${seg}`;
    }
    // this.hora = `${hr}:${min}:${seg}`;

    const meses = ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'];
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaSemana = dias[fecha.getDay()];
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear();
    if (windowWidth <= window.screen.width * (breakpoint / 100)) {
      this.fecha = `${mes} ${dia}`;
    } else {
      this.fecha = `${diaSemana}, ${mes} ${dia} de ${anio}`;
    }
    

    setTimeout(() => {
      this.mostrarReloj();
    }, 1000);
  }

  formatoHora(hora: number): string {
    let horaString = hora.toString();
    if (hora < 10) {
      horaString = '0' + hora;
    }
    return horaString;
  }
}