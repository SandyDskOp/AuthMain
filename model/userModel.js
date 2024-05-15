const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const validator = require("validator");
const bcrypt = require("bcryptjs")
const crypto = require("crypto")

const userModel = new Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid Email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "The password must be atleast 8 charachters"],
    select: false,
  },
  confirm: {
    type: String,
    required: [true, "Password is required"],
    validate: [
      function (el) {
        return el === this.password;
      },
      "Password and Confirm password does not match",
    ],
  },
  passwordChangedAt:{
    type:Date
  },
  passwordResetToken:String,
  passwordResetExpires:Date,
},{timestamps:true});

userModel.pre('save',async function(next){
    if(!this.isModified("password")){
        return next();
    }
    this.password = await bcrypt.hash(this.password,12)
    this.confirm = undefined;
    next()
})

userModel.methods.correctPassword = async function(plainTextPassword, hashedPassword) {
    return await bcrypt.compare(plainTextPassword, hashedPassword);
}

userModel.methods.changedPasswordAfter = function(jwtTime){ 
    if(this.passwordChangedAt){
        const changedTime = parseInt(this.passwordChangedAt.getTime()/1000,10)
        return jwtTime < changedTime;
    }
    return false
}

userModel.methods.createPasswordResetToken=function(){
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    console.log(resetToken,this.passwordResetToken);
    return resetToken;
}

const Users = mongoose.model("User", userModel);
module.exports = Users;
