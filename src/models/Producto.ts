export class Producto {
    ProductoID: number;
    nombre: string;
    precio: number;
    descripcion: string;
    stock: number;
    categoriaID: number;
    imagen: string;

    constructor(productoID: number, nombre: string, precio: number, descripcion: string, stock: number, categoriaID: number, imagen: string) {
        this.ProductoID = productoID;
        this.nombre = nombre;
        this.precio = precio;
        this.descripcion = descripcion;
        this.stock = stock;
        this.categoriaID = categoriaID;
        this.imagen = imagen;
    }
}
