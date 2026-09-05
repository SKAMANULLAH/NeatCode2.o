const validator = require('validator')

// it will check whether req.body contains valid data or not when registering

const validate = (obj)=>{
    const mandatory = ['firstName' , 'email' , 'password'];
const isAllowed = mandatory.every((elem)=>Object.keys(obj).includes(elem))

if(!isAllowed){
    throw new Error('Field is missing !');
}
if(!validator.isEmail(obj.email)){
    throw new Error('Invalid email !');
}
if(!validator.isStrongPassword(obj.password)){
    throw new Error('Weak Password !');
}


}
module.exports = validate;