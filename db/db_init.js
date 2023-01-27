const db = require("./db_connection");

const drop_counter_table_sql = "DROP TABLE IF EXISTS `counter`;"
db.execute(drop_counter_table_sql);

/**** Create table (again)  ****/

const create_counter_table_sql = `
    CREATE TABLE counter (
        id INT NOT NULL AUTO_INCREMENT,
        item VARCHAR(45) NOT NULL,
        quantity INT NOT NULL,
        description VARCHAR(150) NULL,
        PRIMARY KEY (id)
    );
`
db.execute(create_counter_table_sql);

/**** Create some sample items ****/

const insert_counter_table_sql = `
    INSERT INTO counter 
        (item, quantity, description) 
    VALUES 
        (?, ?, ?);
`
db.execute(insert_counter_table_sql, ['Toes', '10', 'Toes are on your feet. You can wiggle them.']);

db.execute(insert_counter_table_sql, ['Planets', '8', 'They orbit around the sun.']);

db.execute(insert_counter_table_sql, ['Balls', '6', 'They bounce.']);

db.execute(insert_counter_table_sql, ['Thingamabob', '54321', 'Yes.']);

/**** Read the sample items inserted ****/

const read_counter_table_sql = "SELECT * FROM counter";

db.execute(read_counter_table_sql, 
    (error, results) => {
        if (error) 
            throw error;

        console.log("Table 'counter' initialized with:")
        console.log(results);
    }
);

db.end();