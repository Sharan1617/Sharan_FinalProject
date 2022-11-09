//object express from 'express' library
//import all modules we need
const express = require('express');
const path = require('path');

// FileUpload logic
const fileUpload = require('express-fileupload'); //for file upload
// FileUpload logic
const session = require('express-session');

//set-up express-validator
const {check, validationResult} = require('express-validator');

//set up and connect to mongoDB
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/FinalProject', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

//define an object which we will be storing
const Order = mongoose.model('Order', {       
    name : String,
    phoneNumber : Number,
    email : String,
    userImageName : String,
    userDescription: String
});

const User = mongoose.model('User', {
    uName: String,
    uPass: String
});
                                
//set up the app   (myApp is the object)
var myApp = express();

//set up the session middleware
myApp.use(session({
    secret: 'supersuperSecret',
    resave: false,
    saveUninitialized: true  //can be used to track what user is doing
}));

myApp.use(express.urlencoded({extended:false}));

myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static(__dirname+'/public'));
myApp.set('view engine', 'ejs');

//for file upload
myApp.use(fileUpload());

// define the route for index page "/"
myApp.get('/',function(req, res){
    res.render('form')
});

//validations happen here
myApp.post('/',[
    check('name', 'Name field cannot be empty').notEmpty(),
    check('userDescription','Description cannot be empty').notEmpty(),

    check('phoneNumber', 'Enter Phone Number in right format').matches(/^[1-9]{1}[0-9]{2}[0-9]{3}[0-9]{4}/),

    check('email', 'Enter Email in correct format').isEmail(),

], function(req, res){

    const errors = validationResult(req); //variable to check error

    if(errors.isEmpty()){ 

        //fetching all values
        var name = req.body.name;
        var phoneNumber = req.body.phoneNumber;
        var email = req.body.email;
        var userDescription = req.body.userDescription;

// FileUpload logic

//fetch the file
    //2 things to fetch
        //get the name of the file
        var userImageName = req.files.userImage.name; 
        //sve the image file or any file
        var userImageFile = req.files.userImage;  // this is a temp file

//save the file
    //check if the file exists or employ some logic that each filename is unique
    var userImagePath = 'public/uploads/' + userImageName;
    //move the temp file to a permanent location which is the location
    userImageFile.mv(userImagePath, function(err){
        console.log(err);
    });

        // FileUpload logic
        //creating new object to send to ejs
        var pageData = {
            name : name,
            phoneNumber : phoneNumber,
            email : email,
            userDescription : userDescription, 
            userImageName : userImageName
        }

        //steps for db
        var myOrder = new Order(pageData);
        myOrder.save(); // saves to DB
        //steps for db
        res.render('checkout', pageData);//render file with the created object

    }

    else{ // When there are errors
        console.log(errors.array());
        res.render('form', {errors: errors.array()})
    }   
});

myApp.get('/login',function(req, res){
    res.render('login'); 
});

//now to see what happens when user login (when login page is opened)
//now we make the login page work and when correct username and password will be given then only all complaints will be displayed

myApp.post('/login', function(req,res){

    //fetching username and password from login form
    var uName = req.body.uname;
    var uPass = req.body.upass;

    //search username and password from database just like we found one order in the database
    User.findOne({uName:uName, uPass:uPass}).exec(function(err,user){
    //set up the session for logged in user
    console.log('Errors' + err);
    //if we have found out the user, then
    if(user) //this will check if user has some data in it
    {
    //set up the session variable
    req.session.uName = user.uName;
    req.session.loggedIn = true; //to check if logged in    
    res.redirect('/allComplaint');      
    }
    else
    {
    res.render('login',{err:"Incorrect Username or Password! Enter Again"} );
        //if user not found redirect to logout page
    console.log("Error: " + err);
    }
    });   
});
// FOR FETCHING DATA FROM DATABASE
// show all orders
myApp.get('/allComplaint',function(req, res){

    //if the username and password are correct then only allComplaint page will open
    if(req.session.loggedIn)
    {
        // write some code to fetch all the values from db and send to the view allComplaint
        Order.find({}).exec(function(err, orders){
        console.log(err);
        console.log(orders);
        res.render('allComplaint', {orders:orders}); // will render allComplaint.ejs
        });
    }
    else
    {
        res.redirect('/login');
    }
});

myApp.get('/print/:orderid', function(req, res){
    var orderId = req.params.orderid;
    Order.findOne({_id: orderId}).exec(function(err, order){
        console.log(order);
        res.render('singleComplaint', order);
    });
})


//logout 
myApp.get('/logout',function(req,res){

    //just unset the variables you unset
    req.session.uName = '';
    req.session.loggedIn = false;

    res.redirect('/login');  
});

//to delete
myApp.get('/delete/:orderid', function(req, res){  //fetching orderid ...// this /delete is the route
    if(req.session.loggedIn)
    {
        var orderId = req.params.orderid;
        Order.findByIdAndDelete({_id: orderId}).exec(function(err, order){
            console.log(order);
            res.render('delete', order); 
        });
    }
    else
    {

        res.send('Login first');
    }

})

//for editing get method
myApp.get('/edit/:orderid', function(req, res){

    var orderId = req.params.orderid;

    Order.findOne({_id: orderId}).exec(function(err, order){
        res.render('edit', order); 
    });
})


// Editing post method
myApp.post('/editprocess/:orderid', function(req, res)
{
    if(!req.session.loggedIn){
        res.redirect('/login');
    }

    else
    {
        //fetching all values
        var name = req.body.name;
        var phoneNumber = req.body.phoneNumber;
        var email = req.body.email;
        var userDescription = req.body.userDescription;

        var userImageName = req.files.userImage.name; 
        var userImageFile = req.files.userImage;  

        var userImagePath = 'public/uploads/' + userImageName;
        userImageFile.mv(userImagePath, function(err){
            console.log(err);
        });

        var orderId = req.params.orderid;
        Order.findOne({_id: orderId}).exec(function(err, order)
        {
            order.name = name;
            order.email = email;
            order.phoneNumber= phoneNumber;
            order.userDescription = userDescription;
            order.userImageName = userImageName;
            order.save();
            res.render('singleComplaint', order); 
        });
    }
});

//create route
myApp.get('/setup', function(req,res){

    //define what we want to insert
    let userData = [
        {
            uName: 'admin',
            uPass: 'admin'
        }
    ]
    User.collection.insertMany(userData); //insert it into the database
    res.send('data added'); 
});

//start the server (listen at a port)
myApp.listen(8080);
console.log('Everything is running smoothly, Open http://localhost:8080/ in the browser');