import {Router} from 'express';
import { addLecturesByCourseId, createCourse, deleteLectureByCourseId, getAllCourseById, getAllCourses, removeCourse, updateCourse } from '../controllers/course.controllers.js';
import { authorizedRoles, authorizedSubscriber, isLoggedIn } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';

const router = Router();

router.route('/')
    .get(getAllCourses)
    .post(isLoggedIn, authorizedRoles("ADMIN"), upload.single('thumbnail'), createCourse)
    .delete(
        isLoggedIn,
        authorizedRoles("ADMIN"),
        deleteLectureByCourseId
    );

router.route('/:id')
    // .get(isLoggedIn, authorizedSubscriber, getAllCourseById)
    .get(isLoggedIn, getAllCourseById)    // remove this after after assingning plan_id to server/.env
    .put(isLoggedIn, authorizedRoles("ADMIN"), updateCourse)
    .delete(
        isLoggedIn,
        authorizedRoles("ADMIN"), 
        removeCourse
    )
    .post(
        isLoggedIn,
        authorizedRoles("ADMIN"),
        upload.single('lecture'),
        addLecturesByCourseId
    ) 

export default router;