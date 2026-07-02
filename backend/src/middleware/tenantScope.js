import mongoose from "mongoose";

export function tenantScope(req, res, next) {
  if (!req.user?.organizationId) {
    return res.status(401).json({ message: "Organization context required" });
  }

  const organizationId = new mongoose.Types.ObjectId(req.user.organizationId);

  const baseFilter = (extra = {}) => ({
    organizationId,
    ...extra,
  });

  req.scopedQuery = (Model, extra = {}) =>
    Model.find(baseFilter(extra));

  req.scopedFindOne = (Model, extra = {}) =>
    Model.findOne(baseFilter(extra));

  req.scopedFindOneAndUpdate = (Model, extra, update, options = {}) =>
    Model.findOneAndUpdate(baseFilter(extra), update, {
      new: true,
      runValidators: true,
      ...options,
    });

  req.scopedFindOneAndDelete = (Model, extra = {}) =>
    Model.findOneAndDelete(baseFilter(extra));

  next();
}
