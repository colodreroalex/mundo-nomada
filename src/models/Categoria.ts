export class Categoria {
    CategoriaID: number;
    Nombre: string;
    Descripcion: string;


    constructor(categoriaID: number, nombre: string, descripcion: string) {
        this.CategoriaID = categoriaID;
        this.Nombre = nombre;
        this.Descripcion = descripcion;
    }
}
