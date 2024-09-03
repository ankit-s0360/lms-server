import ContactForm from "../model/contactForm.model.js";
import User from "../model/user.model.js";
import AppError from "../utils/error.utils.js";

const contactFormController = async (req, res, next) => {
    try {
        const {name, email, message} = req.body;

        if(!name || !email || !message){
            return next(new AppError("All filelds are required", 500));
        }

        const contactForm = await ContactForm({name, email, message});
        await contactForm.save();

        res.status(201).json({
            success: true,
            message: "Contact form successfully submitted",
            contactForm
        })
    } catch (error) {
        return next(new AppError(error || "Contact form not submitted", 500));
    }
};

const getAllUsers = async(req, res, next) => {

    try {
        const users = await User.find({});
        const allUserCount = users.length;
        // const subscriptions = await razorpay.subscriptions.all({});
        const subscriptions = 5;
        const statData = { allUserCount, subscriptions }
        res.status(200).json({
            success: true,
            message: "stats data fetched successfully",
            statData
        })
        
    } catch (error) {
        return next(new AppError(error || "Could not fetched users", 500));
    }
}

export {
    contactFormController,
    getAllUsers
}