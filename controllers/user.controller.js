
import { Router } from "express"
import AppError from "../utils/error.utils.js";
import User from "../model/user.model.js";
const router = Router();
import cloudinary from 'cloudinary';
import fs from 'fs/promises';
import sendEmail from "../utils/sendEmail.js";
import crypto from 'crypto'



const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000,    // 7 days
    httpOnly:true,
    Secure:true,
    sameSite: 'Lax',
}

const register = async(req, res, next) => {

    const {fullname, email, password} = req.body;
    // console.log("request body", fullname, password, email);
    
    

    if(!fullname || !email || !password){
        return next(new AppError("Every field is required", 400))
    }else if(password.length < 8){
        return next(new AppError("Password must be atleast 8 characters", 400));
    }

    const userExists = await User.findOne({email});
    if(userExists){
        return next(new AppError("User already exists", 400))
    }

    const user = await User.create({
        fullname,
        email,
        password,
        avatar:{
            public_id:email,
            secure_url:"https://unsplash.com/photos/silhouette-of-man-illustration-2LowviVHZ-E"
        }
    })

    if(!user){
        return next(new AppError("User registration failed, Please try again", 400))
    }

    // file upload
    // console.log('filename>', JSON.stringify(req.file));
    if(req.file){
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder:'lms',
                width:250,
                height:250,
                gravity:'faces',
                crop:'fill'
            });

            if(result){
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;
            }

            // remove file from server
            fs.rm(`uploads/${req.file.filename}`);

        } catch (error) {
            return next(
                new AppError(error || "File not uploaded, Please try again", 500)
            )
        }
    }

    await user.save();

    user.password = undefined;

    const token = await user.generateJWTToken();
    res.cookie('token', token, cookieOptions);

    res.status(201).json({
        success:true,
        message:"User registered successfully",
        user
    })
}

const login = async(req, res, next) => {
    
    try {
        const {email, password} = req.body;
        // console.log("req body", email, password);
          
        if(!email || !password){
            return next(new AppError('All fields are required', 400));
        }
    
        const user = await User.findOne({
            email
        }).select('+password');

        if(!user || !await user.comparePassword(password)){
            return next(new AppError('Email or password does not match', 400));
        }
    
        const token = await user.generateJWTToken();
        user.password = undefined;
        res.cookie("token", token, cookieOptions);
           
        res.status(200).json({
            success:true,
            message:"User loggedin successfully",
            user
        })
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
}

const logout = (req, res) => {
    res.cookie('token', null, {
        Secure:true,
        maxAge:0,
        httpOnly:true
    })

    res.status(200).json({
        success:true,
        message:"User logged out successfully"
    })
}

const getProfile = async(req, res, next) => {
    try {
        const userid = req.user.id;
        console.log("userid", userid);
        
        const user = await User.findById(userid);
    
        res.status(200).json({
            success:true,
            message:"User details",
            user
    })
    } catch (error) {
        return next(new AppError('Failed to fetch profile details', 400));
    }
}

const forgotPassword = async(req, res, next) => {

    const {email} = req.body;
    if(!email) {
        return next(new AppError('Email is required', 400));
    }

    const user = await User.findOne({email})
    if(!user){
        return next(new AppError('Email not registered', 400));
    }

    const resetToken = await user.generatePasswordResetToken();

    await user.save();

    const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    console.log(resetPasswordURL);
    const subject = 'Reset Password'
    const message = `You can reset your password by clicking <a href = ${resetPasswordURL} target="_blank"> Reset your password<a/>\n if the above link does not work for some reason then copy paste this link  in new tab ${resetPasswordURL}\n if you have not requested this kindly ignore `
    
    try {
        await sendEmail({email, subject, message});

        res.status(200).json({
            success:true,
            message:`Reset password token has been sent to ${email} successfully`
        })
    } catch (error) {
        user.forgotPasswordExpiry = undefined;
        user.forgotPasswordToken = undefined;

        await user.save();
        return next(new AppError(error.message, 500))
    }
}

const resetPassword = async(req, res, next) => {
    const {resetToken} = req.params;
    const {password} = req.body;

    const forgotPasswordToken = crypto
       .createHash('sha256')
       .update(resetToken)
       .digest('hex')
    ; 
    console.log(forgotPasswordToken);

    const user = await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry: { $gt : Date.now() }
    });

    if(!user){
        return next(
            new AppError('Token is invalid or expired, Please try again', 400)
        )
    }

    user.password = password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save();
    
    res.status(200).json({
        success:true,
        message:"Password changed successfully!"
    })
}

const changePassword = async(req, res, next) => {
    const {oldPassword, newPassword} = req.body;
    // const {id} = req.params;
    const {id} = req.user;

    if(!oldPassword || !newPassword){
        return next(
            new AppError("All fields are mandatory", 400)
        )
    }

    const user = await User.findById(id).select("+password");

    if(!user){
        return next(
            new AppError("User does not exist", 400)
        )
    }

    const isPasswordValid = await user.comparePassword(oldPassword);

    if(!isPasswordValid){
        return next(
            new AppError("Invalid old password", 400)
        )
    }

    user.password = newPassword;

    await user.save();

    user.password = undefined;

    res.status(200).json({
        success:true,
        message:"Password changed successfully!"
    })
}

const updateUser = async(req, res, next) => {
    const {fullname} = req.body;
    const {id} = req.user;

    const user = await User.findById(id);
    console.log("pre", user);

    if(!user){
        return next(
            new AppError("User does not exist", 400)
        )
    }

    if(req.body.fullname){
        user.fullname = fullname;
    }
    if(req.file){
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);

        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder:'lms',
                width:250,
                height:250,
                gravity:'faces',
                crop:'fill'
            });

            if(result){
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;
            }

            // remove file from server
            fs.rm(`uploads/${req.file.filename}`);

        } catch (error) {
            return next(
                new AppError(error || "File not uploaded, Please try again", 500)
            )
        }
    }

    await user.save();
    console.log("post", user);

    res.status(200).json({
        success:true,
        message:"User details uploaded successfully!",
        user
    })
}

export {
    register,
    login, 
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateUser
}