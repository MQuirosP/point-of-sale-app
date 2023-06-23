import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})

export class TicketService {
  separator: string = '----------------------------------------------------------'
  backendUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

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
            const {
              doc_number,
              customer_name,
              createdAt,
              sub_total,
              taxes_amount,
              total,
              saleItems,
            } = saleData;

            const lineHeight = 5; // Espacio vertical ocupado por cada línea
            const headerHeight = 40; // Espacio vertical ocupado por el encabezado
            const itemHeight = saleItems.length * 2.7 * lineHeight; // Espacio vertical ocupado por los artículos
            const footerHeight = 25; // Espacio vertical ocupado por el pie de página
            const totalHeight = 20; // Espacio vertical ocupado por el total
            const minHeight =
              headerHeight + itemHeight + footerHeight + totalHeight;

            const doc = new jsPDF('p', 'mm', [58, minHeight]);

            doc.setFontSize(14);
            doc.text('Verdulería Sol', 29, 10, { align: 'center' });
            doc.setFontSize(8);
            doc.text('Margarita Quirós Pizarro', 29, 13, { align: 'center' });
            doc.text('céd. 6-0331-0720', 29, 16, { align: 'center' });
            doc.setFontSize(8);
            doc.text('Tiquete de Venta', 2, 22);
            doc.setFontSize(9);
            doc.text(`N° ${doc_number}`, 2, 26);

            doc.setFontSize(8);
            doc.text(`Fecha: ${createdAt}`, 2, 30);
            doc.text(`Cliente: ${customer_name}`, 2, 35);
            doc.text(
              `${this.separator}`,
              1,
              37
            );
            let y = 42;

            saleItems.forEach((item: any, index: number) => {
              const {
                name,
                quantity,
                sale_price,
                taxes_amount,
                total: totalPrice,
              } = item;

              doc.setFontSize(10);
              // doc.text(`Producto ${index + 1}:`, 2, y);
              doc.text(`${name}`, 2, y);
              y += 3;
              doc.setFontSize(8);
              doc.text(`Cantidad:`, 7, y);
              doc.text(`${quantity}`, 40, y, { align: 'right' });
              y += 3;
              doc.text(`Precio:`, 7, y);
              doc.text(`${sale_price}`, 40, y, { align: 'right' });
              y += 3;
              doc.text(`IVA:`, 7, y);
              doc.text(`${taxes_amount}`, 40, y, { align: 'right' });
              y += 3;
              doc.text(`Total:`, 7, y);

              const formattedTotalPrice = totalPrice.toLocaleString('es-CR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
              doc.text(`${formattedTotalPrice}`, 41, y, { align: 'right' });
              y += 5;
            });

            doc.text(
              `${this.separator}`,
              1,
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
            doc.text(`Sub Total: ${formattedSubTotalAmount}`, 50, y, {
              align: 'right',
            });
            y += 5;
            doc.text(`IVA:     ${formattedTaxesAmount}`, 50, y, {
              align: 'right',
            });
            y += 5;

            doc.setFontSize(10);
            const formattedTotal = total.toLocaleString('es-CR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });

            doc.text(`Total: ${formattedTotal}`, 51, y, { align: 'right' });
            y += 5;
            doc.setFontSize(10);
            doc.text('¡Gracias por su preferencia!', 29, y, {
              align: 'center',
            });
            doc.save(`${docNumber}.pdf`);
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
