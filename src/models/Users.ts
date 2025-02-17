export class User {
    id: number;
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    created_at: Date;

    constructor(id: number, name: string, email: string, password: string, role: 'admin' | 'user', created_at: Date) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.created_at = created_at;
    }
}
