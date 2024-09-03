import {model, Schema} from 'mongoose';

const contactFormSchema = new Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        unique: false
    },
    message: {
        type: String,
        required: [true, "Message is required"]
    }
},
{
    timestamps: true,
}
);

const ContactForm = model("ContactForm", contactFormSchema);
export default ContactForm;