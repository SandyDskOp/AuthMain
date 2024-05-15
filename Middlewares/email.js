const nodemailer = require("nodemailer")
require("dotenv").config

const transporter = nodemailer.createTransport({
    host:process.env.EMAIL_HOST,
    port:25,
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    }
})

const sendMail = async(options)=>{
    const mailOptions ={
        from:"Santhosh Kumar <santhoshkumar.io>",
        to:options.email,
        subject:options.subject,
        text:options.message
    }
    await transporter.sendMail(mailOptions)
}

module.exports ={sendMail}