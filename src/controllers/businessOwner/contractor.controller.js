const { contractorCreateService, contractorListService, contractorDeleteService, contractorDetailsService, contractorScheduleService, updateContractorService } = require('../../services/contractor.service');

exports.contractorCreate = async (req, res) => {
    const data = await contractorCreateService(req.body, req.user.userId);
    res.status(200).json({
        status: "success",
        message: "Contractor created successfully",
        data
    })
};

exports.contractorList = async (req, res) => {
    const data = await contractorListService(req.user.userId);
    res.status(200).json({
        status: "success",
        message: "Contractor list fetched successfully",
        data
    })

};

exports.contractorDetails = async (req, res) => {
    const data = await contractorDetailsService(req.params.contractorId, req.user.userId);
    res.status(200).json({
        status: "success",
        message: "Contractor details fetched successfully",
        data
    })

};

exports.contractorDelete = async (req, res) => {
    const data = await contractorDeleteService(req.params.contractorId, req.user.userId);
    res.status(200).json({
        status: "success",
        message: "Contractor deleted successfully"
    })

};

exports.contractorSchedule = async (req, res) => {
    const data = await contractorScheduleService(req.params.contractorId, req.body, req.user.userId);
    res.status(200).json({
        status: "success",
        message: "Contractor schedule updated successfully",
        data
    })
};

exports.updateContractor = async (req, res) => {
    const data = await updateContractorService(req.params.contractorId, req.body, req.user.userId);
    res.status(200).json({
        status: "success",
        message: "Contractor details updated successfully",
        data
    })
};