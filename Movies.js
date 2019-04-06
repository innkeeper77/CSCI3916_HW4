var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

// user schema
var MovieSchema = new Schema({
    title: { type: String, required: true, index: { unique: true }},
    year: { type: String, required: true},
    genre: { type: String, required: true}, // Should limit to specific genres?
    actors: [ //Array of 3 actors that were in the film
        { ActorName: { type: String, required: true}, ActorCharacter: { type: String, required: true} },
        { ActorName: { type: String, required: true}, ActorCharacter: { type: String, required: true} },
        { ActorName: { type: String, required: true}, ActorCharacter: { type: String, required: true} }
    ]
});

MovieSchema.pre('save', function(next) {
        next(); // Not sure exactly what this is, but it seems to be all that is needed from the Users.js template
});

// return the model
module.exports = mongoose.model('Movie', MovieSchema);