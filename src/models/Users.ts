export class User {
    id: number;
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    created_at: Date;
    updated_at: Date | null;
    password_updated_at: Date | null;

    constructor(
        id: number, 
        name: string, 
        email: string, 
        password: string, 
        role: 'admin' | 'user', 
        created_at: Date, 
        updated_at: Date | null = null,
        password_updated_at: Date | null = null
    ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.password_updated_at = password_updated_at;
    }
}
