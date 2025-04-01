import { Component, Input, OnInit } from '@angular/core';
import { Carrito } from '../../../models/Carrito';
import { User } from '../../../models/Users';
import { PdfService } from '../../services/pdf.service';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../services/carrito.service';

// Interfaz para datos de envío
export interface DatosEnvio {
  nombre: string;
  apellidos: string;
  direccion: string;
  codigoPostal: string;
  ciudad: string;
  provincia: string;
  telefono: string;
  email: string;
}

@Component({
  selector: 'app-receipt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receipt.component.html',
  styleUrls: ['./receipt.component.css']
})
export class ReceiptComponent implements OnInit {
  @Input() items: Carrito[] = [];
  @Input() total: number = 0;
  @Input() user: User | null = null;
  @Input() orderId: string = '';
  @Input() showButtons: boolean = true;
  @Input() iva: number = 0;
  @Input() envio: number = 0;
  @Input() totalConIvaYEnvio: number = 0;
  @Input() datosEnvio: DatosEnvio | null = null; // Nuevo campo para datos de envío

  subtotal: number = 0;
  fechaCompra: Date = new Date();
  loading: boolean = false;
  downloadComplete: boolean = false;

  constructor(
    private pdfService: PdfService,
    private carritoService: CarritoService
  ) { }

  ngOnInit(): void {
    if (!this.orderId) {
      this.orderId = `ORD-${new Date().getTime()}`;
    }
    
    // Asegurar que tenemos todos los valores calculados
    // En caso de no recibir los valores como Input, calcularlos
    this.subtotal = this.total; // Usaremos el total como subtotal si no viene el subtotal específicamente
    
    // Si no tenemos valores de IVA o envío, calcularlos
    if (this.iva === 0 && this.envio === 0 && this.totalConIvaYEnvio === 0) {
      const totales = this.carritoService.calcularTotalesPedido(this.subtotal);
      this.iva = totales.iva;
      this.envio = totales.envio;
      this.totalConIvaYEnvio = totales.totalConIvaYEnvio;
    }
  }

  /**
   * Descarga el recibo como PDF usando el elemento HTML
   */
  downloadReceiptFromTemplate(): void {
    this.loading = true;
    this.pdfService.generatePdfFromElement('receipt-container', `recibo_${this.orderId}`)
      .then(() => {
        this.loading = false;
        this.downloadComplete = true;
        setTimeout(() => this.downloadComplete = false, 3000);
      })
      .catch(error => {
        console.error('Error al generar PDF:', error);
        this.loading = false;
      });
  }

  /**
   * Descarga el recibo generando directamente el PDF
   */
  downloadDirectPdf(): void {
    this.loading = true;
    try {
      this.pdfService.generateReceiptPdf(
        this.items, 
        this.subtotal, 
        this.user, 
        this.orderId,
        this.iva,
        this.envio,
        this.totalConIvaYEnvio,
        this.datosEnvio // Añadimos los datos de envío
      );
      this.loading = false;
      this.downloadComplete = true;
      setTimeout(() => this.downloadComplete = false, 3000);
    } catch (error) {
      console.error('Error al generar PDF directo:', error);
      this.loading = false;
    }
  }
}
