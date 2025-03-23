import { Injectable, ElementRef } from '@angular/core';
import { Carrito } from '../../models/Carrito';
import { User } from '../../models/Users';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  constructor() { }

  /**
   * Genera un PDF a partir de un elemento HTML
   * @param elementId ID del elemento HTML a convertir en PDF
   * @param fileName Nombre del archivo PDF
   */
  generatePdfFromElement(elementId: string, fileName: string): Promise<void> {
    // Obtener el elemento DOM
    const element = document.getElementById(elementId);
    if (!element) {
      return Promise.reject(new Error(`Elemento con ID ${elementId} no encontrado`));
    }

    return html2canvas(element, {
      scale: 2, // Mejor calidad
      useCORS: true, // Permitir imágenes de otros dominios
      logging: false // Desactivar logs
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${fileName}.pdf`);
      return Promise.resolve();
    });
  }

  /**
   * Genera un PDF de recibo de compra directamente (sin requerir un elemento HTML)
   * @param items Items del carrito
   * @param total Total de la compra
   * @param user Usuario que realiza la compra (puede ser null para invitados)
   * @param orderId ID de la orden (opcional)
   */
  generateReceiptPdf(items: Carrito[], total: number, user: User | null, orderId?: string): void {
    // Crear un nuevo documento PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Fecha actual
    const date = new Date().toLocaleDateString('es-ES');
    const time = new Date().toLocaleTimeString('es-ES');

    // Generar número de orden si no se proporciona
    if (!orderId) {
      orderId = `ORD-${new Date().getTime()}`;
    }

    // Configuración de colores y fuentes
    pdf.setFillColor(52, 152, 219); // Color azul para el encabezado
    pdf.rect(0, 0, 210, 25, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.text('MUNDO NÓMADA - RECIBO DE COMPRA', 105, 15, { align: 'center' });
    
    // Información de la compra
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.text(`Fecha: ${date}`, 20, 35);
    pdf.text(`Hora: ${time}`, 20, 42);
    pdf.text(`Número de orden: ${orderId}`, 20, 49);
    
    // Información del cliente
    pdf.setFontSize(14);
    pdf.text('Información del cliente', 20, 60);
    pdf.setFontSize(12);
    pdf.text(`Cliente: ${user ? user.name + ' ' : 'Usuario invitado'}`, 20, 67);
    pdf.text(`Email: ${user ? user.email : 'No disponible'}`, 20, 74);
    
    // Encabezado de la tabla
    pdf.setFillColor(240, 240, 240);
    pdf.rect(20, 85, 170, 8, 'F');
    pdf.setFontSize(11);
    pdf.text('Producto', 25, 90);
    pdf.text('Cantidad', 100, 90);
    pdf.text('Precio/ud', 130, 90);
    pdf.text('Subtotal', 170, 90, { align: 'right' });
    
    // Línea bajo el encabezado
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, 93, 190, 93);
    
    // Contenido de los productos
    let yPosition = 100;
    items.forEach((item, index) => {
      if (item.producto) {
        // Alternar colores de fondo para mejorar legibilidad
        if (index % 2 === 1) {
          pdf.setFillColor(249, 249, 249);
          pdf.rect(20, yPosition - 5, 170, 10, 'F');
        }
        
        // Posición para el texto
        const nombre = item.producto.nombre;
        // Acortar el nombre si es demasiado largo
        const nombreMostrado = nombre.length > 30 ? nombre.substring(0, 27) + '...' : nombre;
        
        pdf.text(nombreMostrado, 25, yPosition);
        pdf.text(item.cantidad.toString(), 100, yPosition);
        pdf.text(`${item.producto.precio.toFixed(2)} €`, 130, yPosition);
        const subtotal = item.cantidad * item.producto.precio;
        pdf.text(`${subtotal.toFixed(2)} €`, 170, yPosition, { align: 'right' });
        
        yPosition += 10;
        
        // Si nos acercamos al final de la página, crear una nueva
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
          
          // Añadir encabezado de la tabla en la nueva página
          pdf.setFillColor(240, 240, 240);
          pdf.rect(20, yPosition, 170, 8, 'F');
          pdf.setFontSize(11);
          pdf.text('Producto', 25, yPosition + 5);
          pdf.text('Cantidad', 100, yPosition + 5);
          pdf.text('Precio/ud', 130, yPosition + 5);
          pdf.text('Subtotal', 170, yPosition + 5, { align: 'right' });
          
          // Línea bajo el encabezado
          pdf.setDrawColor(200, 200, 200);
          pdf.line(20, yPosition + 8, 190, yPosition + 8);
          
          yPosition += 15;
        }
      }
    });
    
    // Añadir línea antes del total
    pdf.setDrawColor(100, 100, 100);
    pdf.line(20, yPosition, 190, yPosition);
    
    // Total
    yPosition += 10;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total:', 140, yPosition);
    pdf.text(`${total.toFixed(2)} €`, 170, yPosition, { align: 'right' });
    
    // Nota de agradecimiento
    yPosition += 20;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('¡Gracias por tu compra!', 105, yPosition, { align: 'center' });
    
    // Información de contacto
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.text('Si tienes alguna pregunta sobre tu pedido, por favor contáctanos a:', 105, yPosition, { align: 'center' });
    yPosition += 7;
    pdf.setTextColor(41, 128, 185);
    pdf.text('mundonomadabaena@gmail.com', 105, yPosition, { align: 'center' });
    
    // Pie de página
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(8);
    pdf.text('© 2025 Mundo Nómada - Todos los derechos reservados', 105, 290, { align: 'center' });
    
    // Guardar el PDF
    pdf.save(`recibo_${orderId}.pdf`);
  }
}
