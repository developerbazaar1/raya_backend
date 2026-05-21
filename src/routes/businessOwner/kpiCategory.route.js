const router = require('express').Router();
const {authenticate, validate}= require('../../middlewares');
const asyncHandler = require('../../utils/asyncHandler');
const {createKpiCategoryValidation} = require('../../validations/kpiCategory.validator');
const {createKpiCategory} = require('../../controllers/businessOwner/kpiCategory.controller');


router.post('/', authenticate('business_owner'), 
validate(createKpiCategoryValidation), 
asyncHandler(createKpiCategory)
);

module.exports = router;
