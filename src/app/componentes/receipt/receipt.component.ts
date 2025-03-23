import { Component, Input, OnInit } from '@angular/core';
import { Carrito } from '../../../models/Carrito';
import { User } from '../../../models/Users';
import { PdfService } from '../../services/pdf.service';
import { CommonModule } from '@angular/common';

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

  fechaCompra: Date = new Date();
  loading: boolean = false;
  downloadComplete: boolean = false;

  constructor(private pdfService: PdfService) { }

  ngOnInit(): void {
    if (!this.orderId) {
      this.orderId = `ORD-${new Date().getTime()}`;
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
      this.pdfService.generateReceiptPdf(this.items, this.total, this.user, this.orderId);
      this.loading = false;
      this.downloadComplete = true;
      setTimeout(() => this.downloadComplete = false, 3000);
    } catch (error) {
      console.error('Error al generar PDF directo:', error);
      this.loading = false;
    }
  }

  /**
   * Imprimir el recibo directamente en la impresora
   */
  printReceipt(): void {
    window.print();
  }
}
