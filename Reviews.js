var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

// user schema
var ReviewSchema = new Schema({
    author_id: { type: Schema.Types.ObjectId, ref: "UserSchema", required: true }, //username of reviewer
    movie: { type: Schema.Types.ObjectId, ref: "MovieSchema", required: true },
    rating: { type: Number, min: 0, max: 5, required: true},
    quote: { type: String },
});

ReviewSchema.pre('save', function(next) {
    next(); // Still not sure exactly what this is
});

// return the model
module.exports = mongoose.model('Review', ReviewSchema);