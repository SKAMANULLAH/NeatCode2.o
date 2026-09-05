const mongoose = require('mongoose')

const {Schema} = mongoose;

const topicSchema = new Schema({
title:{type:String, unique:true , required:true},
subtopic:{
    type:[
        {
            title:{type:String},
            content:{type:String}
        }
    ]
},



})
const topicModel = mongoose.model('topic' , topicSchema)
module.exports = topicModel;