import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MostrarProductsComponent } from "../mostrar-products/mostrar-products.component";

@Component({
  selector: 'app-main',
  imports: [CommonModule, MostrarProductsComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
})
export class MainComponent {
  showHistory: boolean = false;

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
  }
}
