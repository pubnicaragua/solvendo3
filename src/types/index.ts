export interface UserMetadata {
    role?: string;
    full_name?: string;
    avatar_url?: string;
    [key: string]: any;
}

export interface User {
    id: string;
    email: string;
    nombres?: string;
    apellidos?: string;
    rut?: string;
    telefono?: string;
    direccion?: string;
    activo: boolean;
    created_at: string;
    user_metadata?: UserMetadata;
    role?: string;
}