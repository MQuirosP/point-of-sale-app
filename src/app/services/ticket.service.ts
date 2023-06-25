import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { environment } from 'src/environments/environment';

interface SaleItem {
  name: string;
  quantity: number;
  sale_price: number;
  taxes_amount: number;
  total: number;
}

interface SaleData {
  doc_number: string;
  customer_name: string;
  createdAt: string;
  sub_total: number;
  taxes_amount: number;
  total: number;
  saleItems: SaleItem[];
}

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  separator: string = '-'.repeat(48);
  backendUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  private generatePDF(ticketData: SaleData): jsPDF {
    const {
      doc_number,
      customer_name,
      createdAt,
      sub_total,
      taxes_amount,
      total,
      saleItems,
    } = ticketData;

    const lineHeight = 5; // Espacio vertical ocupado por cada línea
    const headerHeight = 40; // Espacio vertical ocupado por el encabezado
    const itemHeight = saleItems.length * 2.7 * lineHeight; // Espacio vertical ocupado por los artículos
    const footerHeight = 25; // Espacio vertical ocupado por el pie de página
    const totalHeight = 20; // Espacio vertical ocupado por el total
    const minHeight = headerHeight + itemHeight + footerHeight + totalHeight;

    const customWidth = 58; // Ancho personalizado en mm
    const customHeight = minHeight; // Altura personalizada en mm

    const doc = new jsPDF('p', 'mm', [customWidth, customHeight]);

  const marginLeft = 3; // Margen izquierdo en mm

  doc.setFontSize(14);
  doc.text('Verdulería Sol', marginLeft + 29, 10, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Margarita Quirós Pizarro', marginLeft + 29, 13, { align: 'center' });
  doc.text('céd. 6-0331-0720', marginLeft + 29, 16, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Tiquete de Venta', marginLeft + 3, 22);
  doc.setFontSize(9);
  doc.text(`N° ${doc_number}`, marginLeft + 3, 26);

  doc.setFontSize(8);
  doc.text(`Fecha: ${createdAt}`, marginLeft + 3, 30);
  doc.text(`Cliente: ${customer_name}`, marginLeft + 2, 35);
  doc.text(
    `${this.separator}`,
    marginLeft + 1,
    37
  );
  let y = 42;

  saleItems.forEach((item: SaleItem, index: number) => {
    doc.setFontSize(10);
    doc.text(`${item.name}`, marginLeft + 3, y);
    y += 3;
    doc.setFontSize(8);
    doc.text(`Cantidad:`, marginLeft + 7, y);
    doc.text(`${item.quantity}`, marginLeft + 40, y, { align: 'right' });
    y += 3;
    doc.text(`Precio:`, marginLeft + 7, y);
    doc.text(`${item.sale_price}`, marginLeft + 40, y, { align: 'right' });
    y += 3;
    doc.text(`IVA:`, marginLeft + 7, y);
    doc.text(`${item.taxes_amount}`, marginLeft + 40, y, { align: 'right' });
    y += 3;
    doc.text(`Total:`, marginLeft + 7, y);

    const formattedTotalPrice = item.total.toLocaleString('es-CR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    doc.text(`${formattedTotalPrice}`, marginLeft + 41, y, { align: 'right' });
    y += 5;
  });

  doc.text(
    `${this.separator}`,
    marginLeft + 1,
    y
  );
  y += 5;
  const formattedSubTotalAmount = sub_total.toLocaleString('es-CR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedTaxesAmount = taxes_amount.toLocaleString('es-CR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  doc.text(`Sub Total: ${formattedSubTotalAmount}`, marginLeft + 48, y, {
    align: 'right',
  });
  y += 5;
  doc.text(`IVA:     ${formattedTaxesAmount}`, marginLeft + 48, y, {
    align: 'right',
  });
  y += 5;

  doc.setFontSize(10);
  const formattedTotal = total.toLocaleString('es-CR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  doc.text(`Total: ${formattedTotal}`, marginLeft + 49, y, { align: 'right' });
  y += 5;
  doc.setFontSize(10);
  doc.text('¡Gracias por su preferencia!', marginLeft + 25, y, {
    align: 'center',
  });

  return doc;
}

  private printPDF(doc: jsPDF): void {
    doc.save('ticket.pdf');

    const pdfData = doc.output('blob');
    const fileURL = URL.createObjectURL(pdfData);

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = fileURL;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow.print();
    };
  }

  generateTicket(docNumber: string): void {
    this.http
      .get<any>(`${this.backendUrl}sales/doc_number/${docNumber}`)
      .subscribe({
        next: (response: any) => {
          if (
            response.success &&
            response.message &&
            response.message.Sale.length > 0
          ) {
            const saleData = response.message.Sale[0];
            const ticketData: SaleData = {
              doc_number: saleData.doc_number,
              customer_name: saleData.customer_name,
              createdAt: saleData.createdAt,
              sub_total: saleData.sub_total,
              taxes_amount: saleData.taxes_amount,
              total: saleData.total,
              saleItems: saleData.saleItems,
            };

            const doc = this.generatePDF(ticketData);
            this.printPDF(doc);
          } else {
            console.error('Error al obtener los datos del documento');
          }
        },
        error: (error: any) => {
          console.error(
            'Error en la petición para obtener los datos del documento',
            error
          );
        },
      });
  }
}
