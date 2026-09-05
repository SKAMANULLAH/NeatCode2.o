const mongoose = require('mongoose')

async function main(){
   await mongoose.connect(process.env.DB_STRING);
console.log(`Connected to cluster`);

}

module.exports= main;