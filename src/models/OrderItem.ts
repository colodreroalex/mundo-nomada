export interface OrderItem {
  id: number;
  order_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  nombre?: string; // opcional, para mostrar el nombre del producto si se incluye en la consulta
}
