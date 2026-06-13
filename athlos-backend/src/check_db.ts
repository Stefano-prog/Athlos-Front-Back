import db from "./config/db";

async function main() {
    try {
        console.log("Querying database tables...");
        const result = await db.query(
            `SELECT table_name FROM information_schema.tables WHERE table_schema='public';`
        );
        console.log("Tables found:");
        console.log(result.rows);
        
        // Let's check plan schema details
        console.log("\nQuerying 'plan' column info...");
        const planCols = await db.query(
            `SELECT column_name, data_type, is_nullable 
             FROM information_schema.columns 
             WHERE table_name = 'plan';`
        );
        console.log(planCols.rows);

        // Let's check rutina schema details
        console.log("\nQuerying 'rutina' column info...");
        const rutinaCols = await db.query(
            `SELECT column_name, data_type, is_nullable 
             FROM information_schema.columns 
             WHERE table_name = 'rutina';`
        );
        console.log(rutinaCols.rows);

        // Let's check rutinaejercicio schema details
        console.log("\nQuerying 'rutinaejercicio' column info...");
        const reCols = await db.query(
            `SELECT column_name, data_type, is_nullable 
             FROM information_schema.columns 
             WHERE table_name = 'rutinaejercicio';`
        );
        console.log(reCols.rows);
        
        process.exit(0);
    } catch (err) {
        console.error("Error executing query:", err);
        process.exit(1);
    }
}

main();
