
import db from '../config/db';

export const findUserById = async (id: number) => {
    const result = await db.query(
        `SELECT idusuario, nombre, email, peso, talla, edad, puntos, identorno
         FROM usuario WHERE idusuario = $1`,
        [id]
    );
    return result.rows[0] ?? null;
};

export const updateUserData = async (
    id: number,
    nombre: string | undefined,
    email: string | undefined,
    peso: number,
    talla: number,
    edad: number
) => {
    let result;
    if (nombre && email) {
        result = await db.query(
            `UPDATE usuario SET nombre = $1, email = $2, peso = $3, talla = $4, edad = $5
             WHERE idusuario = $6
             RETURNING idusuario, nombre, email, peso, talla, edad, puntos, identorno`,
            [nombre, email, peso, talla, edad, id]
        );
    } else {
        result = await db.query(
            `UPDATE usuario SET peso = $1, talla = $2, edad = $3
             WHERE idusuario = $4
             RETURNING idusuario, nombre, email, peso, talla, edad, puntos, identorno`,
            [peso, talla, edad, id]
        );
    }
    return result.rows[0] ?? null;
};

export const updateUserEnvironment = async (id: number, identorno: number) => {
    const result = await db.query(
        `UPDATE usuario SET identorno = $1
         WHERE idusuario = $2
         RETURNING idusuario, nombre, email, peso, talla, edad, puntos, identorno`,
        [identorno, id]
    );
    return result.rows[0] ?? null;
};