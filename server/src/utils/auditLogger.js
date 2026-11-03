const AuditLog = require('../models/AuditLog');

const logAudit = async ({ user, action, entityType, entityId, details = {}, req = null }) => {
  try {
    const ipAddress = req ? req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '' : '';
    await AuditLog.create({
      user: user?._id || user || null,
      action,
      entityType,
      entityId: entityId || null,
      details,
      ipAddress: String(ipAddress),
    });
  } catch (err) {
    // Fail silently so audit logging errors don't crash core operations
    console.warn('[AuditLog] Failed to record audit log:', err.message);
  }
};

module.exports = { logAudit };
