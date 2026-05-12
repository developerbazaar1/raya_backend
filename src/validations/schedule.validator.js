const { body } = require("express-validator");
const { SCHEDULE_STATUS } = require("../config/constant");

exports.scheduleUpdateValidation = [
    body("status").optional().isIn(SCHEDULE_STATUS).withMessage("Invalid status")
]