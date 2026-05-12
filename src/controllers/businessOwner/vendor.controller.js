const { vendorCreateService, vendorListService, vendorDeleteService, vendorDetailsService, vendorScheduleService, updateVendorService } = require('../../services/vendor.service');

exports.vendorCreate = async (req, res) => {
    const data = await vendorCreateService(req.body, req.user.userId);

    res.status(201).json({
        status: "success",
        message: 'Vendor created successfully',
        data,
    });
};

exports.vendorList = async (req, res) => {
    const data = await vendorListService(req.user.userId);

    res.status(200).json({
        status: "success",
        message: 'Vendor list fetched successfully',
        data,
    });
}

exports.vendorDetails = async (req, res) => {
    const data = await vendorDetailsService(req.params.vendorId, req.user.userId);

    res.status(200).json({
        status: "success",
        message: 'Vendor details fetched successfully',
        data,
    });
}

exports.vendorSchedule = async (req, res) => {
    const data = await vendorScheduleService(req.params.vendorId, req.body, req.user.userId);

    res.status(200).json({
        status: "success",
        message: 'Vendor schedule updated successfully',
        data,
    });
}

exports.updateVendor = async (req, res) => {
    const data = await updateVendorService(req.params.vendorId, req.body, req.user.userId);

    res.status(200).json({
        status: "success",
        message: 'Vendor updated successfully',
        data,
    });
}
exports.vendorDelete = async (req, res) => {
    const data = await vendorDeleteService(req.params.vendorId, req.user.userId);

    res.status(200).json({
        status: "success",
        message: 'Vendor deleted successfully',

    });
}