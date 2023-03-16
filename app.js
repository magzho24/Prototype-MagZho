//set up the server
const express = require( "express" );
const helmet = require("helmet");
const logger = require("morgan");
const app = express();
const port = process.env.PORT || 8080;
const db = require('./db/db_pool');
const { auth, requiresAuth } = require('express-openid-connect');
const dotenv = require('dotenv');
dotenv.config();


// Configure Express to use EJS
app.set( "views",  __dirname + "/views");
app.set( "view engine", "ejs" );


//Configure Express to use certain HTTP headers for security
//Explicitly set the CSP to allow certain sources
app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'cdnjs.cloudflare.com']
      }
    }
})); 


const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// define middleware that serves static resources in the public directory
app.use(express.static(__dirname + '/public'));
// Configure Express to parse URL-encoded POST request bodies (traditional forms)
app.use( express.urlencoded({ extended: false }) );


app.use(logger("dev"));

app.use((req, res, next) => {
    res.locals.isLoggedIn = req.oidc.isAuthenticated();
    res.locals.user = req.oidc.user;
    next();
})

app.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
  });

app.get('/authtest', requiresAuth(), (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});
  
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
    WHERE
        userid = ?
`
app.get( "/counter", requiresAuth(), ( req, res ) => {
    db.execute(read_stuff_all_sql, [req.oidc.user.email], (error, results) => {
        if (error){
            res.status(500).send(error); //Internal Server Error
        }
        else{
            res.render('counter', {inventory : results}); // results is still an array
        }
    });
});


// define a route for the item detail page
const read_item_sql = 'SELECT id, item, quantity, description FROM counter WHERE id = ? AND userid = ?'

app.get("/counter/edit/:id", requiresAuth(), (req, res) => {
    db.execute(read_item_sql, [req.params.id, req.oidc.user.email], (error, results) => {
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
    AND
        userid = ?
`
app.get("/counter/edit/:id/delete", requiresAuth(), ( req, res ) => {
    db.execute(delete_item_sql, [req.params.id, req.oidc.user.email], (error, results) => {
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
        (item, quantity, description, userid)
    VALUES
        (?, ?, ?, ?)
`
app.post("/counter", requiresAuth(), ( req, res ) => {
    db.execute(create_item_sql, [req.body.name, req.body.quantity, req.body.description, req.oidc.user.email], (error, results) => {
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
    AND
        userid = ?
`
app.post("/counter/edit/:id", requiresAuth(), ( req, res ) => {
    db.execute(update_item_sql, [req.body.name, req.body.quantity, req.body.description, req.params.id, req.oidc.user.email], (error, results) => {
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