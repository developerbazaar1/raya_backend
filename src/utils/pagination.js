const paginate = async (
  model,
  query = {},
  page = 1,
  limit = 10,
  populate = [],
  select = '-__v ',
) => {
  const skip = (page - 1) * limit;

  // Fetch paginated data
  const results = await model.find(query).skip(skip).limit(limit).populate(populate).select(select);

  // Count total number of records for pagination info
  const totalCount = await model.countDocuments(query);

  // Calculate totalPages
  const totalPages = Math.ceil(totalCount / limit);

  return {
    results,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
    },
  };
};

module.exports = paginate;
