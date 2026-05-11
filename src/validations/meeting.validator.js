const { body } = require("express-validator");

exports.meetingCreateValidation = [
    body("title")
        .trim()
        .notEmpty()
        .withMessage("Title is required"),
    body("date")
        .trim()
        .notEmpty()
        .withMessage("Date is required"),
    body("startTime")
        .trim()
        .notEmpty()
        .withMessage("Start Time is required")
        .matches(/^(0?[1-9]|1[0-2])[: ]([0-5]\d)\s?(AM|PM|[Aa][Mm]|[Pp][Mm])$/)
        .withMessage("Start Time must be in 12-hour format with AM or PM (e.g., 12:12 AM)"),
    body("endTime")
        .trim()
        .notEmpty()
        .withMessage("End Time is required")
        .matches(/^(0?[1-9]|1[0-2])[: ]([0-5]\d)\s?(AM|PM|[Aa][Mm]|[Pp][Mm])$/)
        .withMessage("End Time must be in 12-hour format with AM or PM (e.g., 12:12 AM)"),
    body("invitedMembers")
        .isArray()
        .withMessage("Invited members must be an array"),
    body("invitedMembers.*")
        .isMongoId()
        .withMessage("Invalid invited member ID"),
]
