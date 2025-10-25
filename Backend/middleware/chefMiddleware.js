const Chef = require("../models/Chef");

// Check if user is an approved chef
exports.isApprovedChef = async (req, res, next) => {
  try {
    const chef = await Chef.findOne({
      user: req.user.id,
      status: "approved",
    });

    if (!chef) {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Approved chef profile required.",
      });
    }

    req.chef = chef;
    next();
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Check if chef owns the resource
exports.isChefOwner = async (req, res, next) => {
  try {
    const resourceId = req.params.chefId || req.body.chefId;

    if (!resourceId) {
      return res.status(400).json({
        status: "error",
        message: "Resource ID required",
      });
    }

    if (req.chef._id.toString() !== resourceId) {
      return res.status(403).json({
        status: "error",
        message: "Access denied. You can only access your own resources.",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
