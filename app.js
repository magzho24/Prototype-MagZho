//set up the server
const express = require( "express" );
const logger = require("morgan");
const app = express();
app.use(helmet());
const port = process.env.PORT || 8080;
const db = require('./db/db_pool');
const helmet = require("helmet");

// Configure Express to use EJS
app.set( "views",  __dirname + "/views");
app.set( "view engine", "ejs" );



// define middleware that serves static resources in the public directory
app.use(express.static(__dirname + '/public'));
// Configure Express to parse URL-encoded POST request bodies (traditional forms)
app.use( express.urlencoded({ extended: false }) );


app.use(logger("dev"));

// define a route for the default home page
app.get( "/", ( req, res ) => {
    res.render('index');
} );

// define a route for the inventory page
const read_stuff_all_sql = `
    SELECT 
        id, item, quantity
    FROM
        counter
`
app.get( "/counter", ( req, res ) => {
    db.execute(read_stuff_all_sql, (error, results) => {
        if (error){
            res.status(500).send(error); //Internal Server Error
        }
        else{
            res.render('counter', {inventory : results}); // results is still an array
        }
    });
});


// define a route for the item detail page
const read_item_sql = 'SELECT id, item, quantity, description FROM counter WHERE id = ?'

app.get("/counter/edit/:id", (req, res) => {
    db.execute(read_item_sql, [req.params.id], (error, results) => {
        if(error) {
            res.status(500).send(error); //Internal Server Error
        }
        else if(results.length == 0) {
            res.status(404).send(`No item found with id = "${req.params.id}"` ); // NOT FOUND
        }
        else {
            let data = results[0]; //results is still an array
            //data's object structure:
            // {item: __, quantity: ___, description: ____ }
            res.render('edit', data);
        }
    });
});

// define a route for item DELETE
const delete_item_sql = `
    DELETE 
    FROM
        counter
    WHERE
        id = ?
`
app.get("/counter/edit/:id/delete", ( req, res ) => {
    db.execute(delete_item_sql, [req.params.id], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect("/counter");
        }
    });
});

// define a route for item Create
const create_item_sql = `
    INSERT INTO counter
        (item, quantity, description)
    VALUES
        (?, ?, ?)
`
app.post("/counter", ( req, res ) => {
    db.execute(create_item_sql, [req.body.name, req.body.quantity, req.body.description], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            //results.insertId has the primary key (id) of the newly inserted element.
            res.redirect(`/counter/edit/${results.insertId}`);
        }
    });
});

// define a route for item UPDATE
const update_item_sql = `
    UPDATE
        counter
    SET
        item = ?,
        quantity = ?,
        description = ?
    WHERE
        id = ?
`
app.post("/counter/edit/:id", ( req, res ) => {
    db.execute(update_item_sql, [req.body.name, req.body.quantity, req.body.description, req.params.id], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect(`/counter/edit/${req.params.id}`);
        }
    });
});

// start the server
app.listen( port, () => {
    console.log(`App server listening on ${ port }. (Go to http://localhost:${ port })` );
} );