const AuditLog = require('../models/AuditLog');

const logAction = async ({
  user = null,
  userName = 'System',
  role = 'SYSTEM',
  action,
  entity,
  entityId = null,
  details = {},
  req = null
}) => {
  try {
    let ipAddress = '';
    let userAgent = '';

    if (req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
      userAgent = req.headers['user-agent'] || '';
      if (!user && req.user) {
        user = req.user._id;
        userName = req.user.name;
        role = req.user.role;
      }
    }

    await AuditLog.create({
      user,
      userName,
      role,
      action,
      entity,
      entityId,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date()
    });
  } catch (error) {
    // Audit log failure shouldn't crash the main transaction, but log cleanly to stderr
    console.error('⚠️ Failed to persist audit log:', error.message);
  }
};

module.exports = { logAction };
