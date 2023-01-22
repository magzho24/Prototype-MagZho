//set up the server
const express = require( "express" );
const logger = require("morgan");
const app = express();
const port = 8080;

app.use(logger("dev"));
// define middleware that serves static resources in the public directory
app.use(express.static(__dirname + '/public'));

// define a route for the default home page
app.get( "/", ( req, res ) => {
    res.sendFile( __dirname + "/views/index.html" );
} );

// define a route for the stuff inventory page
app.get( "/counter", ( req, res ) => {
    res.sendFile( __dirname + "/views/counter.html" );
} );

// define a route for the item detail page
app.get( "/counter/edit", ( req, res ) => {
    res.sendFile( __dirname + "/views/edit.html" );
} );

// start the server
app.listen( port, () => {
    console.log(`App server listening on ${ port }. (Go to http://localhost:${ port })` );
} );