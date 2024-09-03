import Course from "../model/course.model.js";
import AppError from "../utils/error.utils.js";
import cloudinary from 'cloudinary';
import fs from 'fs/promises';



const getAllCourses = async function(req, res, next){
    
    try {
        const courses = await Course.find({}).select('-lectures');

        res.status(200).json({
            success:true,
            message:'All Courses',
            courses
        })
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
} 

const getAllCourseById = async function(req, res, next){
    try {
        const {id} = req.params;

        const course = await Course.findById(id);

        if(!course){
            return next(new AppError('Invalid course id', 400))
        }

        res.status(200).json({
            success:true,
            message:"Course lectures fetched successfully",
            lectures:course.lectures
        })
    } catch (error) {
        return next(
            new AppError(error.message, 500)
        )
    }
}

const createCourse = async(req, res, next) => {
    const {title, description, category, createdBy} = req.body;

    if(!title || !description || !category || !createdBy){
        return next(
            new AppError("All fields are required", 400)
        )
    }

    const course = await Course.create({
        title,
        description, 
        category,
        createdBy,
        thumbnail:{
            public_id:'Dummy',
            secure_url:'Dummy'
        }
    })

    if(!course){
        return next(
            new AppError("Course could not created, Please try again", 400)
        )
    }

    if(req.file){
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder:'lms'
            });
    
            if(result){
                course.thumbnail.public_id = result.public_id;
                course.thumbnail.secure_url = result.secure_url;
            }
    
            fs.rm(`uploads/${req.file.filename}`);
    
            await course.save();
    
            res.status(200).json({
                success:true,
                message:'Course created successfully',
                course
            })
        } catch (error) {
            return next(
                new AppError(error.message, 500)
            )
        }
    }
}

const updateCourse = async (req, res, next) => {
    try {
        const {id} = req.params;

        const course = await Course.findByIdAndUpdate(
            id,
            {
                $set: req.body
            },
            {
                runValidators: true
            }
        );

        if(!course){
            return next(
                new AppError("Course with given id does not exist", 500)
            )
        }

        res.status(200).json({
            success:true,
            message:"Course updated successfully",
            course
        });

    } catch (error) {
        return next(
            new AppError(error.message, 500)
        )
    }
}

const removeCourse = async (req, res, next) => {
    try {
        const {id} = req.params;

        const course = await Course.findById(id);

        if(!course){
            return next(
                new AppError("Course with given id does not exist", 500)
            )
        }

        await Course.findByIdAndDelete(id);

        res.status(200).json({
            success:true,
            message:"Course deleted successfully",
            course
        });

    } catch (error) {
        return next(
            new AppError(error.message, 500)
        )
    }
}    
    
const addLecturesByCourseId = async(req, res, next) => {
        
    try {
        const {title, description} = req.body;
        const {id} = req.params;
    
        if(!title || !description){
            return next(
                new AppError("All fields are required", 400)
            )
        }
    
        const course = await Course.findById(id);
        if(!course){
            return next(
                new AppError("Course with given id does not exist", 500)
            )
        }
    
        const lecturesData = {
            title,
            description,
            lecture:{}
        }

        if(req.file){
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    resource_type: 'video',
                    folder:'lms'
                });
        
                if(result){
                    // console.log("result", result);
                    lecturesData.lecture.public_id = result.public_id;
                    lecturesData.lecture.secure_url = result.secure_url;
                }
        
                fs.rm(`uploads/${req.file.filename}`);
                  
            } catch (error) {
                return next(
                    new AppError(error.message, 500)
                )
            }
    
            course.lectures.push(lecturesData);
            course.numberOfLectures = course.lectures.length;
    
            await course.save();
    
            res.status(200).json({
                success:true,
                message:'Course lectures added successfully',
                course
            })
        }
    } catch (error) {
        return next(
            new AppError(error.message, 500)
        )
    }

}

const deleteLectureByCourseId = async (req, res, next) => {
    const {courseId, lectureId} = req.query;

    try {
        const course = await Course.findById(courseId);
        if(!course){
            return next(
                new AppError("Course not found", 404)
            )
        }
        const lectureIndex = course.lectures.findIndex(i => i._id.toString() === lectureId);
        if(lectureIndex === -1){
            return next(
                new AppError("Lecture not found", 404)
            )
        }
        course.lectures.splice(lectureIndex, 1);
        await course.save();

        res.status(200).json({
            success: true,
            message: "Lecture deleted successfully",
            course
        })
    } catch (error) {
        return next(
            new AppError(error.message, 500)
        )
    }
}

export{
    getAllCourses,
    getAllCourseById,
    createCourse,
    updateCourse,
    removeCourse,
    addLecturesByCourseId,
    deleteLectureByCourseId
}