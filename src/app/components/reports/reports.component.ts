import { Component } from '@angular/core';
import { NgbCalendar, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { fadeAnimation } from 'src/app/fadeAnimation';
import { ReportsService } from 'src/app/services/reports.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
  animations: [fadeAnimation],
})
export class ReportsComponent {
  currentDate: NgbDateStruct;
  startDate: NgbDateStruct;
  endDate: NgbDateStruct;

  constructor(
    private reportService: ReportsService,
    private calendar: NgbCalendar
  ) {}

  ngOnInit() {
    this.currentDate = this.calendar.getToday();
    this.startDate = this.calendar.getToday();
    this.endDate = this.calendar.getToday();
  }

  getDate() {
    const startDateInput = <HTMLInputElement>(
      (document.getElementById('salesStartDate') ||
        document.getElementById('purchasesStartDate'))
    );
    const endDateInput = <HTMLInputElement>(
      (document.getElementById('salesEndDate') ||
        document.getElementById('purchasesEndDate'))
    );
    const startDateParts = startDateInput.value.split('-');
    const endDateParts = endDateInput.value.split('-');

    this.startDate = {
      year: parseInt(startDateParts[0]),
      month: parseInt(startDateParts[1]),
      day: parseInt(startDateParts[2]),
    };

    this.endDate = {
      year: parseInt(endDateParts[0]),
      month: parseInt(endDateParts[1]),
      day: parseInt(endDateParts[2]),
    };
  }

  formatDate(date: NgbDateStruct): string {
    const { year, month, day } = date;
    return `${year}-${this.padZero(month)}-${this.padZero(day)}`;
  }

  padZero(value: number): string {
    return value.toString().padStart(2, '0');
  }

  generateDetailSalesReport() {
    this.getDate();

    const endDateObj = new Date(
      this.endDate.year,
      this.endDate.month - 1,
      this.endDate.day
    );
    endDateObj.setDate(endDateObj.getDate() + 1);
    const updatedEndDate = this.formatDate({
      year: endDateObj.getFullYear(),
      month: endDateObj.getMonth() + 1,
      day: endDateObj.getDate(),
    });

    this.reportService.generateDetailSalesReport(
      this.formatDate(this.startDate),
      updatedEndDate
    );
    this.resetDates();
  }

  generateGeneralSalesReport() {
    this.getDate();

    const endDateObj = new Date(
      this.endDate.year,
      this.endDate.month - 1,
      this.endDate.day
    );
    endDateObj.setDate(endDateObj.getDate() + 1);
    const updatedEndDate = this.formatDate({
      year: endDateObj.getFullYear(),
      month: endDateObj.getMonth() + 1,
      day: endDateObj.getDate(),
    });

    this.reportService.generateGeneralSalesReport(
      this.formatDate(this.startDate),
      updatedEndDate
    );
    this.resetDates();
  }

  resetDates() {
    this.startDate = this.calendar.getToday();
    this.endDate = this.calendar.getToday();
  }

  generateDetailPurchasesReport() {
    this.getDate();

    const endDateObj = new Date(
      this.endDate.year,
      this.endDate.month - 1,
      this.endDate.day
    );
    endDateObj.setDate(endDateObj.getDate() + 1);
    const updatedEndDate = this.formatDate({
      year: endDateObj.getFullYear(),
      month: endDateObj.getMonth() + 1,
      day: endDateObj.getDate(),
    });

    this.reportService.generateDetailPurchasesReport(
      this.formatDate(this.startDate),
      updatedEndDate
    );
    this.resetDates();
  }

  generateGeneralPurchasesReport() {
    this.getDate();

    const endDateObj = new Date(
      this.endDate.year,
      this.endDate.month - 1,
      this.endDate.day
    );
    endDateObj.setDate(endDateObj.getDate() + 1);
    const updatedEndDate = this.formatDate({
      year: endDateObj.getFullYear(),
      month: endDateObj.getMonth() + 1,
      day: endDateObj.getDate(),
    });

    this.reportService.generateGeneralPurchasesReport(
      this.formatDate(this.startDate),
      updatedEndDate
    );
    this.resetDates();
  }
}
