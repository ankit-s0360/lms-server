import jwt from 'jsonwebtoken';
import AppError from "../utils/error.utils.js";


const isLoggedIn = async (req, res, next) => {

    console.log("req cookies", req.cookies);
    const { token } = req.cookies;
        
        if(!token){
            return next(new AppError("Unauthenticated, Please login again", 401));
        }
    
        const userDetails = jwt.verify(token, process.env.JWT_SECRET);
        req.user = userDetails;
    
        next();
}

const authorizedRoles = (...roles) => (req, res, next) => {
    const currentUserRole = req.user.role;

    if(!roles.includes(currentUserRole)){
        return next(
            new AppError("You do not have permision to access this", 500)
        )
    }

    next();
};

const authorizedSubscriber = async(req, res, next) => {
    const subscription = req.user.subscription;
    const currentUserRole = req.user.role;

    if(currentUserRole !== 'ADMIN' && subscription.status !== 'active'){
        return next(
            new AppError("Please subscribe to access this route", 404)
        )
    }

    next();
};

export {
    isLoggedIn,
    authorizedRoles,
    authorizedSubscriber
}