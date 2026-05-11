const body = require("express-validator").body;

exports.eventCreateValidation = [

    body("eventName").trim().notEmpty().withMessage("Event name is required"),
    body("date").notEmpty().withMessage("Date is required").isISO8601().withMessage("Invalid date"),
    body("startTime")
        .notEmpty()
        .withMessage("Start Time is required")
        .matches(/^(0?[1-9]|1[0-2])[: ]([0-5]\d)\s?(AM|PM|[Aa][Mm]|[Pp][Mm])$/)
        .withMessage("Start Time must be in 12-hour format with AM or PM (e.g., 12:12 AM)"),

    body("endTime")
        .notEmpty()
        .withMessage("End Time is required")
        .matches(/^(0?[1-9]|1[0-2])[: ]([0-5]\d)\s?(AM|PM|[Aa][Mm]|[Pp][Mm])$/)
        .withMessage("End Time must be in 12-hour format with AM or PM (e.g., 12:12 AM)"),
    body("favorite").trim().notEmpty().withMessage("Favorite is required")
];

exports.eventCreateValidationBusinessOwnerTeam = [
    body("eventName").trim().notEmpty().withMessage("Event Name is required"),
    body("date").notEmpty().withMessage("Date is required").isISO8601().withMessage("Invalid date"),
    body("startTime")
        .notEmpty()
        .withMessage("Start Time is required")
        .matches(/^(0?[1-9]|1[0-2])[: ]([0-5]\d)\s?(AM|PM|[Aa][Mm]|[Pp][Mm])$/)
        .withMessage("Start Time must be in 12-hour format with AM or PM (e.g., 12:12 AM)"),

    body("notes").trim().notEmpty().withMessage("Notes is required"),
];