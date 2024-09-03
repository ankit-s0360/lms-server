import { Schema, model } from "mongoose";
import bcrypt from "bcrypt"
import JWT from "jsonwebtoken"
import crypto from 'crypto';

const userSchema = new Schema({
    fullname:{
        type:String,
        required:[true, "Name is required"],
        maxLength:[50, "Name must be less than 50 characters"],
        minLength:[5, "Name must be atleast 5 characters"],
        lowercase:true,
        trim:true
    },
    email:{
        type:String,
        required:[true, "Email is required"],
        unique:true,
        lowercase:true,
        trim:true,
        match: [/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please enter a valid email']
    },
    password:{
        type:String,
        required:[true, "Password is required"],
        minLength:[8, "Password must be atleast 8 characters"],
        select:false
    },
    avatar:{
        public_id:{
            type:String
        },
        secure_url:{
            type:String
        }
    },
    role:{
       type:String,
       enum:['USER', "ADMIN"],
       default:"USER"
    },
    forgotPasswordToken:String,
    forgotPasswordExpiry:Date,
    subscription:{
        id:String,
        status:String
    }
},{
    timestamps:true
})

userSchema.pre("save", async function(next){
    if(!this.isModified("password")){
        return next()
    }
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods = ({
    generateJWTToken:function(){
        return JWT.sign(
            {id:this._id, email:this.email, subscription:this.subscription, role:this.role},
            process.env.JWT_SECRET,
            {
                expiresIn:process.env.JWT_EXPIRY
            }
        )
    },
    comparePassword: async function(plainTextPassword){
        return await bcrypt.compare(plainTextPassword, this.password);
    },
    generatePasswordResetToken:async function(){
        const resetToken = crypto.randomBytes(20).toString('hex');

        this.forgotPasswordToken = crypto
           .createHash('sha256')
           .update(resetToken)
           .digest('hex')
        ;
        this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000; // 15 min from now

        return resetToken;
    }
    
})
const User = model("User", userSchema);

export default User;