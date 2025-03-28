export class Producto {
    ProductoID: number;
    nombre: string;
    precio: number;
    descripcion: string;
    stock: number;
    categoriaID: number;
    imagen: string;
    color: string | null;
    talla: string | null;

    constructor(
        productoID: number, 
        nombre: string, 
        precio: number, 
        descripcion: string, 
        stock: number, 
        categoriaID: number, 
        imagen: string, 
        color: string | null = null, 
        talla: string | null = null
    ) {
        this.ProductoID = productoID;
        this.nombre = nombre;
        this.precio = precio;
        this.descripcion = descripcion;
        this.stock = stock;
        this.categoriaID = categoriaID;
        this.imagen = imagen;
        this.color = color;
        this.talla = talla;
    }
}
