import { Injectable, ElementRef } from '@angular/core';
import { Carrito } from '../../models/Carrito';
import { User } from '../../models/Users';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  // Logo en base64 para usar en los PDFs
  private logoBase64: string = '';
  // Bandera para saber si ya se intentó cargar el logo
  private logoLoaded: boolean = false;

  constructor() { 
    // Precargar logo al iniciar el servicio
    this.preloadLogo();
  }

  /**
   * Precarga el logo para usarlo en los PDFs
   */
  private preloadLogo(): void {
    // Obtener la ruta correcta para el logo
    const logoUrl = this.getLogoPath();
    
    // Crear un objeto Image para cargar el logo
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Permitir carga cross-origin
    
    img.onload = () => {
      // Crear un canvas para convertir la imagen a base64
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Dibujar la imagen en el canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          // Convertir a base64
          this.logoBase64 = canvas.toDataURL('image/jpeg');
          this.logoLoaded = true;
          console.log('Logo cargado correctamente');
        } catch (e) {
          console.error('Error al convertir logo a base64:', e);
        }
      }
    };
    
    img.onerror = () => {
      console.error('No se pudo cargar el logo desde la ruta directa, intentando rutas alternativas');
      
      // Intentar con rutas alternativas
      img.src = '/img/logo.jpg';
      
      // Segunda oportunidad de carga
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            this.logoBase64 = canvas.toDataURL('image/jpeg');
            this.logoLoaded = true;
            console.log('Logo cargado desde ruta alternativa');
          } catch (e) {
            console.error('Error al convertir logo a base64 (segundo intento):', e);
          }
        }
      };
    };
    
    // Iniciar la carga de la imagen
    img.src = logoUrl;
  }

  /**
   * Método para corregir la ruta del logo según el entorno
   * @returns La URL correcta para el logo
   */
  private getLogoPath(): string {
    // Ruta absoluta verificada del logo
    return 'C:/Users/garci/Desktop/Angular/MUNDO-NOMADA-FULL/mundo-nomadaCOPY/public/img/logo.jpg';
  }
  
  /**
   * Logo predeterminado en base64 en caso de que no se pueda cargar el archivo
   * Este es un respaldo para garantizar que siempre se mostrará un logo
   */
  private getDefaultLogoBase64(): string {
    // Un logo básico con el texto "MUNDO NÓMADA" como respaldo
    return 'data:image/png;base64,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';
  }

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
   * @param subtotal Subtotal de la compra (sin IVA ni gastos de envío)
   * @param user Usuario que realiza la compra (puede ser null para invitados)
   * @param orderId ID de la orden (opcional)
   * @param iva Importe del IVA
   * @param envio Gastos de envío
   * @param totalConIvaYEnvio Total final con IVA y gastos de envío
   * @param datosEnvio Datos de envío del pedido (opcional)
   */
  generateReceiptPdf(
    items: Carrito[], 
    subtotal: number, 
    user: User | null, 
    orderId?: string,
    iva?: number,
    envio?: number,
    totalConIvaYEnvio?: number,
    datosEnvio?: any
  ): void {
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

    // Valores por defecto para los parámetros opcionales
    if (iva === undefined) iva = subtotal * 0.21; // 21% por defecto
    if (envio === undefined) envio = subtotal >= 60 ? 0 : 3.5; // Envío gratis a partir de 60€
    if (totalConIvaYEnvio === undefined) totalConIvaYEnvio = subtotal + iva + envio;

    // Configuración de colores y fuentes - Usando la guía de estilos del proyecto
    pdf.setFillColor(121, 21, 21); // Color primario #791515 (rojo oscuro)
    pdf.rect(0, 0, 210, 25, 'F');
    
    // Añadir logo al PDF
    try {
      // Usar el logo precargado en base64 si está disponible
      if (this.logoLoaded && this.logoBase64) {
        pdf.addImage(this.logoBase64, 'JPEG', 10, 5, 30, 15);
      } else {
        // Intentar cargar el logo directamente
        try {
          // Usar el logo predeterminado en caso de cualquier error
          pdf.addImage(this.getDefaultLogoBase64(), 'PNG', 10, 5, 30, 15);
        } catch (error) {
          console.error('Error al cargar el logo:', error);
        }
      }
    } catch (error) {
      console.error('Error al añadir el logo al PDF:', error);
      // Usar el logo predeterminado como respaldo
      try {
        pdf.addImage(this.getDefaultLogoBase64(), 'PNG', 10, 5, 30, 15);
      } catch (e) {
        console.error('Error al cargar el logo predeterminado:', e);
      }
    }
    
    pdf.setTextColor(247, 247, 247); // Color secundario #f7f7f7
    pdf.setFontSize(22);
    pdf.text('RECIBO DE COMPRA', 105, 15, { align: 'center' });
    
    // Información de la compra
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.text(`Fecha: ${date}`, 20, 35);
    pdf.text(`Hora: ${time}`, 20, 42);
    pdf.text(`Número de orden: ${orderId}`, 20, 49);
    
    // Información del cliente
    pdf.setFontSize(14);
    pdf.setTextColor(121, 21, 21); // Color primario para títulos
    pdf.text('Información del cliente', 20, 60);
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Cliente: ${user ? user.name + ' ' : 'Usuario invitado'}`, 20, 67);
    pdf.text(`Email: ${user ? user.email : 'No disponible'}`, 20, 74);
    
    // Información de envío si está disponible
    let yPosition = 82;
    if (datosEnvio) {
      pdf.setFontSize(14);
      pdf.setTextColor(121, 21, 21); // Color primario para títulos
      pdf.text('Datos de envío', 20, yPosition);
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      yPosition += 7;
      pdf.text(`Nombre: ${datosEnvio.nombre} ${datosEnvio.apellidos}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Dirección: ${datosEnvio.direccion}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`CP: ${datosEnvio.codigoPostal} - ${datosEnvio.ciudad}, ${datosEnvio.provincia}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Teléfono: ${datosEnvio.telefono}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Email: ${datosEnvio.email}`, 20, yPosition);
      yPosition += 12; // Espacio adicional antes de los productos
    } else {
      yPosition = 85; // Posición inicial si no hay datos de envío
    }
    
    // Encabezado de la tabla
    pdf.setFillColor(247, 247, 247); // Color secundario #f7f7f7
    pdf.rect(20, yPosition, 170, 8, 'F');
    pdf.setFontSize(11);
    pdf.setTextColor(121, 21, 21); // Color primario para encabezados
    pdf.text('Producto', 25, yPosition + 5);
    pdf.text('Cantidad', 100, yPosition + 5);
    pdf.text('Precio/ud', 130, yPosition + 5);
    pdf.text('Subtotal', 170, yPosition + 5, { align: 'right' });
    
    // Línea bajo el encabezado
    pdf.setDrawColor(121, 21, 21); // Color primario para líneas
    pdf.line(20, yPosition + 8, 190, yPosition + 8);
    
    // Contenido de los productos
    yPosition += 15;
    items.forEach((item, index) => {
      if (item.producto) {
        // Alternar colores de fondo para mejorar legibilidad
        if (index % 2 === 1) {
          pdf.setFillColor(247, 247, 247); // Color secundario #f7f7f7
          pdf.rect(20, yPosition - 5, 170, 10, 'F');
        }
        
        // Posición para el texto
        const nombre = item.producto.nombre;
        // Acortar el nombre si es demasiado largo
        const nombreMostrado = nombre.length > 30 ? nombre.substring(0, 27) + '...' : nombre;
        
        pdf.setTextColor(0, 0, 0);
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
          pdf.setFillColor(247, 247, 247); // Color secundario #f7f7f7
          pdf.rect(20, yPosition, 170, 8, 'F');
          pdf.setFontSize(11);
          pdf.setTextColor(121, 21, 21); // Color primario para encabezados
          pdf.text('Producto', 25, yPosition + 5);
          pdf.text('Cantidad', 100, yPosition + 5);
          pdf.text('Precio/ud', 130, yPosition + 5);
          pdf.text('Subtotal', 170, yPosition + 5, { align: 'right' });
          
          // Línea bajo el encabezado
          pdf.setDrawColor(121, 21, 21); // Color primario para líneas
          pdf.line(20, yPosition + 8, 190, yPosition + 8);
          
          yPosition += 15;
        }
      }
    });
    
    // Añadir línea antes del total
    pdf.setDrawColor(121, 21, 21); // Color primario para líneas
    pdf.line(20, yPosition, 190, yPosition);
    
    // Total
    yPosition += 10;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(121, 21, 21); // Color primario para el total
    
    // Mejora de formato para el resumen de precios - Alineación clara entre etiquetas y valores
    const xEtiqueta = 110; // Posición X para las etiquetas
    const xValor = 180;   // Posición X para los valores (alineados a la derecha)
    
    // Subtotal
    pdf.text('Subtotal:', xEtiqueta, yPosition);
    pdf.text(`${subtotal.toFixed(2)} €`, xValor, yPosition, { align: 'right' });
    
    yPosition += 10;
    // IVA
    pdf.text('IVA (21%):', xEtiqueta, yPosition);
    pdf.text(`${iva.toFixed(2)} €`, xValor, yPosition, { align: 'right' });
    
    yPosition += 10;
    // Gastos de envío
    pdf.text('Gastos de envío:', xEtiqueta, yPosition);
    if (envio === 0) {
      pdf.text('Gratis', xValor, yPosition, { align: 'right' });
    } else {
      pdf.text(`${envio.toFixed(2)} €`, xValor, yPosition, { align: 'right' });
    }
    
    yPosition += 10;
    // Total
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16); // Agrandar el tamaño para el total final
    pdf.text('Total:', xEtiqueta, yPosition);
    pdf.text(`${totalConIvaYEnvio.toFixed(2)} €`, xValor, yPosition, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(14);
    
    // Nota de agradecimiento
    yPosition += 20;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text('¡Gracias por tu compra!', 105, yPosition, { align: 'center' });
    
    // Información de contacto
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.text('Si tienes alguna pregunta sobre tu pedido, por favor contáctanos a:', 105, yPosition, { align: 'center' });
    yPosition += 7;
    pdf.setTextColor(121, 21, 21); // Color primario para el email
    pdf.text('mundonomadabaena@gmail.com', 105, yPosition, { align: 'center' });
    
    // Pie de página
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(8);
    pdf.text('© 2025 Mundo Nómada - Todos los derechos reservados', 105, 290, { align: 'center' });
    
    // Guardar el PDF
    pdf.save(`recibo_${orderId}.pdf`);
  }
}
