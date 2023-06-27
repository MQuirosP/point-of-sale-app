import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { response } from 'express';
import { Toast, ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import * as xlsx from 'xlsx';

interface SaleItem {
  int_code: string;
  name: string;
  quantity: number;
  sale_price: string;
  sub_total: string;
  taxes_amount: string;
  total: string;
}

interface Sale {
  doc_number: string;
  customer_name: string;
  sub_total: string;
  taxes_amount: string;
  total: string;
  saleItems: SaleItem[];
  status: string;
}

interface PurchaseItem {
  int_code: string;
  name: string;
  quantity: string;
  sub_total: string;
  taxes_amount: string;
  purchase_price: string;
  total: string;
}

interface Purchase {
  doc_number: string;
  status: string;
  provider_name: string;
  sub_total: string;
  taxes_amount: string;
  total: string;
  purchaseItems: PurchaseItem[];
}

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private backendUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient, private toastrService: ToastrService) {}

  generateDetailSalesReport(startDate: string, endDate: string) {
    this.http
      .post(`${this.backendUrl}sales-report`, {
        startDate: startDate,
        endDate: endDate,
      })
      .subscribe({
        next: (response: any) => {
          const reportData = response.success ? response.message : [];

          if (reportData) {
            const acceptedSales = reportData.filter(
              (sale: Sale) => sale.status === 'aceptado'
            );
            this.generateDetailSalesExcel(
              acceptedSales, 
              startDate, 
              endDate
              );
            this.toastrService.success(
              'Información de compras recuperada exitosamente.'
            );
          }
        },
        error: (error: any) => {
          this.toastrService.error(
            'Error al generar el reporte de ventas:',
            error
          );
        },
      });
  }

  generateGeneralSalesReport(startDate: string, endDate: string) {
    this.http
      .post(`${this.backendUrl}sales-report`, {
        startDate: startDate,
        endDate: endDate,
      })
      .subscribe({
        next: (response: any) => {
          const reportData = response.success ? response.message : [];
          this.generateGeneralSalesExcel(reportData, startDate, endDate);
          this.toastrService.success(
            'Información de ventas recuperada exitosamente.'
          );
        },
        error: (error) => {
          this.toastrService.error(
            'Error al generar el reporte de ventas:',
            error
          );
        },
      });
  }

  generateGeneralSalesExcel(
    reportData: any[],
    startDate: string,
    endDate: string
  ) {
    const workbook = xlsx.utils.book_new();
    const data: any[][] = [];

    // Agregar encabezado
    data.push(['Reporte General de Ventas']);
    data.push([`Desde: ${startDate}`]);
    data.push([`Hasta: ${endDate}`]);
    // Espacio en blanco
    data.push(['', '', '']);

    data.push([
      'Número de Documento',
      'Fecha de Creación',
      'Cliente',
      'Código',
      'Productos',
      'Cantidad',
      'Precio Unitario',
      'Subtotal',
      'IVA',
      'Total',
    ]);

    reportData.forEach((sale: any) => {
      const { doc_number, createdAt, customer_name, saleItems } = sale;

      saleItems.forEach((item: any) => {
        const {
          int_code,
          name,
          quantity,
          sale_price,
          sub_total,
          taxes_amount,
          total,
        } = item;
        data.push([
          doc_number,
          createdAt,
          customer_name,
          int_code,
          name,
          parseFloat(quantity),
          parseFloat(sale_price),
          parseFloat(sub_total),
          parseFloat(taxes_amount),
          parseFloat(total),
        ]);
      });
    });

    const salesWorksheet = xlsx.utils.aoa_to_sheet(data);

    const columnWidths: number[] = [];
    data.forEach((row) => {
      if (row.length > 0) {
        row.forEach((cell, columnIndex) => {
          const cellContentLength = String(cell).length;
          if (
            !columnWidths[columnIndex] ||
            cellContentLength > columnWidths[columnIndex]
          ) {
            columnWidths[columnIndex] = cellContentLength;
          }
        });
      }
    });

    salesWorksheet['!cols'] = columnWidths.map((width) => ({ width }));

    xlsx.utils.book_append_sheet(
      workbook,
      salesWorksheet,
      'Reporte General de Ventas'
    );

    xlsx.writeFile(workbook, 'reporte_ventas_generales.xlsx');
  }

  generateDetailSalesExcel(
    reportData: any[],
    startDate: string,
    endDate: string
  ) {
    const workbook = xlsx.utils.book_new();
    const data: any[][] = [];

    // Agregar encabezado
    // Agregar encabezado
    data.push(['Reporte Detallado de Ventas']);
    data.push([`Desde: ${startDate}`]);
    data.push([`Hasta: ${endDate}`]);
    // Espacio en blanco
    data.push(['', '', '']);

    reportData.forEach((sale: any) => {
      const {
        doc_number,
        customer_name,
        sub_total,
        taxes_amount,
        total,
        saleItems,
      } = sale;

      data.push(['Número de Documento', 'Cliente', 'Subtotal', 'IVA', 'Total']);
      data.push([
        doc_number,
        customer_name,
        parseFloat(sub_total),
        parseFloat(taxes_amount),
        parseFloat(total),
      ]);
      data.push(['Detalle de la factura:']);
      data.push([
        'Código',
        'Productos',
        'Cantidad',
        'Precio',
        'Subtotal',
        'IVA',
        'Total',
      ]);
      saleItems.forEach((item: any) => {
        const {
          int_code,
          name,
          quantity,
          sale_price,
          sub_total,
          taxes_amount,
          total,
        } = item;
        data.push([
          int_code,
          name,
          quantity,
          parseFloat(sale_price),
          parseFloat(sub_total),
          parseFloat(taxes_amount),
          parseFloat(total),
        ]);
      });

      data.push([]);
    });

    const totalSubtotal = reportData.reduce(
      (total: number, sale: any) => total + parseFloat(sale.sub_total),
      0
    );
    const totalTaxes = reportData.reduce(
      (total: number, sale: any) => total + parseFloat(sale.taxes_amount),
      0
    );
    const totalGrandTotal = totalSubtotal + totalTaxes;

    data.push(['']);
    data.push(['', '', 'RESUMEN:']);
    data.push(['', '', 'Sub Total:', totalSubtotal]);
    data.push(['', '', 'IVA 13%:', totalTaxes]);
    data.push(['', '', 'Total General:', totalGrandTotal]);

    const salesWorksheet = xlsx.utils.aoa_to_sheet(data);

    const columnWidths: number[] = [];
    data.forEach((row) => {
      if (row.length > 0) {
        row.forEach((cell, columnIndex) => {
          const cellContentLength = String(cell).length;
          if (
            !columnWidths[columnIndex] ||
            cellContentLength > columnWidths[columnIndex]
          ) {
            columnWidths[columnIndex] = cellContentLength;
          }
        });
      }
    });

    salesWorksheet['!cols'] = columnWidths.map((width) => ({ width }));

    xlsx.utils.book_append_sheet(
      workbook,
      salesWorksheet,
      'Reporte Detallado de Ventas'
    );

    xlsx.writeFile(workbook, 'reporte_detallado_ventas.xlsx');
  }

  generateDetailPurchasesReport(startDate: string, endDate: string) {
    this.http
      .post(`${this.backendUrl}purchases-report`, {
        startDate: startDate,
        endDate: endDate,
      })
      .subscribe({
        next: (response: any) => {
          const reportData = response.success ? response.message : [];

          if (reportData) {
            const acceptedPurchases = reportData.filter(
              (purchase: Purchase) => purchase.status === 'aceptado'
            );
            this.generateDetailPurchasesExcel(
              acceptedPurchases,
              startDate,
              endDate
            );
            this.toastrService.success(
              'Información de compras recuperada exitosamente.'
            );
          }
        },
        error: (error: any) => {
          this.toastrService.error(
            'Error al generar el reporte de ventas: ',
            error
          );
        },
      });
  }

  generateGeneralPurchasesReport(startDate: string, endDate: string) {
    this.http
    .post(`${this.backendUrl}purchases-report`, {
      startDate: startDate,
      endDate: endDate,
    })
    .subscribe({
      next: (response: any) => {
        const reportData = response.success ? response.message : [];
        this.generateGeneralPurchasesExcel(reportData, startDate, endDate);
        this.toastrService.success('Información de compras recuperada exitosamente.'
        );
      },
      error: (error) => {
        this.toastrService.error('Error al generar el reporte de compras: ',
        error
        );
      },
    });
  }

  generateGeneralPurchasesExcel(
    reportData: any[],
    startDate: string,
    endDate: string
    ) {
      const workbook = xlsx.utils.book_new();
    const data: any[][] = [];

    // Agregar encabezado
    data.push(['Reporte General de Compras']);
    data.push([`Desde: ${startDate}`]);
    data.push([`Hasta: ${endDate}`]);
    // Espacio en blanco
    data.push(['', '', '']);

    data.push([
      'Número de Documento',
      'Fecha de Creación',
      'Proveedor',
      'Código',
      'Productos',
      'Cantidad',
      'Precio Unitario',
      'Subtotal',
      'IVA',
      'Total',
    ]);

    reportData.forEach((purchase: any) => {
      const { doc_number, createdAt, provider_name, purchaseItems } = purchase;

      purchaseItems.forEach((item: any) => {
        const {
          int_code,
          name,
          quantity,
          purchase_price,
          sub_total,
          taxes_amount,
          total,
        } = item;
        data.push([
          doc_number,
          createdAt,
          provider_name,
          int_code,
          name,
          parseFloat(quantity),
          parseFloat(purchase_price),
          parseFloat(sub_total),
          parseFloat(taxes_amount),
          parseFloat(total),
        ]);
      });
    });

    const purchasesWorksheet = xlsx.utils.aoa_to_sheet(data);

    const columnWidths: number[] = [];
    data.forEach((row) => {
      if (row.length > 0) {
        row.forEach((cell, columnIndex) => {
          const cellContentLength = String(cell).length;
          if (
            !columnWidths[columnIndex] ||
            cellContentLength > columnWidths[columnIndex]
          ) {
            columnWidths[columnIndex] = cellContentLength;
          }
        });
      }
    });

    purchasesWorksheet['!cols'] = columnWidths.map((width) => ({ width }));

    xlsx.utils.book_append_sheet(
      workbook,
      purchasesWorksheet,
      'Reporte General de Compras'
    );

    xlsx.writeFile(workbook, 'reporte_compras_generales.xlsx');
  }

  generateDetailPurchasesExcel(
    reportData: any[],
    startDate: string,
    endDate: string,
  ) {
    const workbook = xlsx.utils.book_new();
    const data: any[][] = [];

    // Agregar encabezado
    // Agregar encabezado
    data.push(['Reporte Detallado de Compras']);
    data.push([`Desde: ${startDate}`]);
    data.push([`Hasta: ${endDate}`]);
    // Espacio en blanco
    data.push(['', '', '']);

    reportData.forEach((purchase: any) => {
      const {
        doc_number,
        provider_name,
        sub_total,
        taxes_amount,
        total,
        purchaseItems,
      } = purchase;

      data.push(['Número de Documento', 'Proveedor', 'Subtotal', 'IVA', 'Total']);
      data.push([
        doc_number,
        provider_name,
        parseFloat(sub_total),
        parseFloat(taxes_amount),
        parseFloat(total),
      ]);
      data.push(['Detalle de la factura:']);
      data.push([
        'Código',
        'Productos',
        'Cantidad',
        'Precio',
        'Subtotal',
        'IVA',
        'Total',
      ]);
      purchaseItems.forEach((item: any) => {
        const {
          int_code,
          name,
          quantity,
          purchase_price,
          sub_total,
          taxes_amount,
          total,
        } = item;
        data.push([
          int_code,
          name,
          quantity,
          parseFloat(purchase_price),
          parseFloat(sub_total),
          parseFloat(taxes_amount),
          parseFloat(total),
        ]);
      });

      data.push([]);
    });

    const totalSubtotal = reportData.reduce(
      (total: number, purchase: any) => total + parseFloat(purchase.sub_total),
      0
    );
    const totalTaxes = reportData.reduce(
      (total: number, purchase: any) => total + parseFloat(purchase.taxes_amount),
      0
    );
    const totalGrandTotal = totalSubtotal + totalTaxes;

    data.push(['']);
    data.push(['', '', 'RESUMEN:']);
    data.push(['', '', 'Sub Total:', totalSubtotal]);
    data.push(['', '', 'IVA 13%:', totalTaxes]);
    data.push(['', '', 'Total General:', totalGrandTotal]);

    const purchasesWorksheet = xlsx.utils.aoa_to_sheet(data);

    const columnWidths: number[] = [];
    data.forEach((row) => {
      if (row.length > 0) {
        row.forEach((cell, columnIndex) => {
          const cellContentLength = String(cell).length;
          if (
            !columnWidths[columnIndex] ||
            cellContentLength > columnWidths[columnIndex]
          ) {
            columnWidths[columnIndex] = cellContentLength;
          }
        });
      }
    });

    purchasesWorksheet['!cols'] = columnWidths.map((width) => ({ width }));

    xlsx.utils.book_append_sheet(
      workbook,
      purchasesWorksheet,
      'Reporte Detallado de Compras'
    );

    xlsx.writeFile(workbook, 'reporte_detallado_compras.xlsx');
  }
}
