const {Schema,model} = require("mongoose");

const userSchema = new Schema({
    name:{
        type: String,
        required: true,
        trim: true,
    },
    email:{
        type: String,
        required: true,
        unique:true,
        trim: true,
    },
    password:{
        type: String,
        required: true,
    },
    role:{
        type: String,
        enum: ["SUPER_ADMIN", "CITY_ADMIN", "OFFICER"],
        required: true,
    },
    city:{
        type: String,
        required: true,
        trim: true,
    },
    phone:{
        type: String,
        required: true,
        unique:true,
    }
},{
    timestamps: true,
})

const User = model("User",userSchema)

module.exports = User
