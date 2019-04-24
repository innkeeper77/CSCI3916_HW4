var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var Movie = require('./Movies');
var jwt = require('jsonwebtoken');
var Review = require('./Reviews');
var cors = require('cors');
var mongoose = require('mongoose');

var app = express();
module.exports = app; // for testing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(cors());

var router = express.Router();

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

router.route('/users/:userId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.userId;
        User.findById(id, function(err, user) {
            if (err) res.send(err);

            var userJson = JSON.stringify(user);
            // return that user
            res.json(user);
        });
    });

router.route('/users')
    .get(authJwtController.isAuthenticated, function (req, res) {
        User.find(function (err, users) {
            if (err) res.send(err);
            // return the users
            res.json(users);
        });
    });

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, message: 'Please pass username and password.'});
    }
    else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;
        // save the user
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists. '});
                else
                    return res.send(err);
            }

            res.json({ success: true, message: 'User created!' });
        });
    }
});

router.post('/signin', function(req, res) {
    var userNew = new User();
    userNew.name = req.body.name;
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, message: 'Authentication failed.'});
            }
        });


    });
});

router.route('/movies')
    .post(authJwtController.isAuthenticated, function (req, res) // Post: create a new movie entry
        {
            console.log(req.body);
            // if format = wrong, else post.
            if (!req.body.title ||
                !req.body.year ||
                !req.body.genre ||
                !req.body.actors ||
                !req.body.actors[0].ActorName ||
                !req.body.actors[1].ActorName ||
                !req.body.actors[2].ActorName ||
                !req.body.actors[0].ActorCharacter ||
                !req.body.actors[1].ActorCharacter ||
                !req.body.actors[2].ActorCharacter)
                {
                    res.status(400).json({success: false, message: 'Incorrect movie format'});
                }
            else
            {
                var movie = new Movie();
                movie.title = req.body.title;
                movie.year = req.body.year;
                movie.genre = req.body.genre;
                movie.actor = req.body.actor;
                movie.actors = req.body.actors;

                movie.save(function (err)
                {
                    if (err)
                    {
                        if (err.code === 11000)
                        {
                            return res.status(403).json({success: false, message: "Error: movie title already exists."});
                        }
                        else
                        {
                            return res.status(403).send(err);
                        }
                    }
                    res.status(201).send({success: true, message: "Success: movie added"});
                });
            }
        }
    )
    .get(authJwtController.isAuthenticated, function(req, res)
    {
        if(!req.body)
        {
            return res.status(403).json({success: false, message: "Empty query"});
        }
        else
        {
            Movie.find(req.body).select("title year genre actor").exec(function (err, movie)
            {
                if (err) res.send(err);
                if(movie && movie.length > 0)
                {
                    return res.status(200).json({success: true, message: "Success: movie found", movie: movie});
                }
                else
                {
                    return res.status(404).json({success: false, message: "Error: no movie found", movie: movie});
                }
            })
        }
    })
    .put(authJwtController.isAuthenticated, function (req, res)
    {
        if(!req.body || !req.body.findMovie || !req.body.updateMovieTo)
        {
            return res.status(403).json({success: false, message: "Error: no entity provided to update"});
        }
        else
        {
            Movie.updateMany(req.body.findMovie, req.body.updateMovieTo, function(err, doc)
            {
                if(err)
                {
                    return res.status(403).json({success: false, message: "Update failed"});
                }
                else if(doc.n === 0)
                {
                    return res.status(404).json({success: false, message: "Movie not found"});
                }
                else
                {
                    return res.status(200).json({success: true, message: "Movie updated"});
                }
            })
        }
    })
    .delete(authJwtController.isAuthenticated, function(req, res)
    {
        if(!req.body)
        {
            return res.status(403).json({success: false, message: "Error: no entity provided to delete"});
        }
        else
        {
            Movie.deleteOne(req.body.findMovie, function(err, doc)
            {
                if(err)
                {
                    return res.status(403).json({success: false, message: "Delete failed"});
                }
                else if(doc.n === 0)
                {
                    return res.status(404).json({success: false, message: "Movie not found"});
                }
                else
                {
                    return res.status(200).json({success: true, message: "Movie deleted"});
                }
            })
        }
    })
    .all(function (req, res)
    {
        console.log(req.body);
        res.status(405).send({success: false, message: 'Invalid method.'});
    }
    );

router.route('/reviews')
    .post(authJwtController.isAuthenticated, function (req, res) // Post: create a new review entry for existing movie
    {
        if(!req.body)
        {
            return res.status(403).json({success: false, message: "Empty query"});
        }
        else if(!req.body.quote || !req.body.rating)
        {
            return res.status(403).json({success: false, message: "Incomplete query B"});
        }
        else
        {
            var review = new Review();
            jwt.verify(req.headers.authorization.substring(4), process.env.SECRET_KEY, function(err, decoded)
            {
                if(err)
                {
                    return res.status(403).json({success: false, message: "Invalid authorization? Or other error."});
                }
                else
                {
                    review.author_id = decoded.id;

                    var idMovie = req.body.movie_title;
                    Movie.findById(idMovie, function(err, movie)
                    {
                        if(err)
                        {
                            return res.status(403).json(err);
                        }
                        if (!movie)
                        {
                            return res.status(403).json({success: false, message: "Error: movie not found"});
                        }
                        else
                        {
                            review.movie = movie._id;
                            review.quote = req.body.quote;
                            review.rating = req.body.rating;
                            review.author_id = decoded.author_id;

                            review.save(function(err)
                            {
                                if(err)
                                {
                                    return res.status(403).json({success: false, message: "Error: dev doesn't know what went wrong"});
                                }
                                else
                                {
                                    return res.status(200).send({success: true, message: "Review added"});
                                }
                            })
                        }
                    })
                }
            })
        }
    })
    .all(function (req, res)
    {
        console.log(req.body);
        res = res.status(403);
        res.send("HTTP method not supported");
    });



router.route('/')
    .all(function (req, res)
        {
            console.log(req.body);
            res.status(403).send({success: false, message: 'Root directory: Unauthorized'});
        }
    );

app.use('/', router);
app.listen(process.env.PORT || 8080);
