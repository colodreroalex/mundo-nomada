import { Producto } from "./Producto";

export class Carrito {
  id: number;
  user_id: number;
  producto_id: number;
  cantidad: number;
  producto?: Producto; // Propiedad opcional

  constructor(id: number, user_id: number, producto_id: number, cantidad: number = 1, producto?: Producto) {
    this.id = id;
    this.user_id = user_id;
    this.producto_id = producto_id;
    this.cantidad = cantidad;
    this.producto = producto;
  }
}

