const fs = require('fs');
const path = require('path');

const AUDIT_LOG_FILE = path.join(__dirname, '../logs/audit.log');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log plan status changes
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 * @param {string} action - Action performed (activate, deactivate, create, delete)
 * @param {Object} details - Additional details
 */
function logPlanStatusChange(userId, planId, action, details = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    userId,
    planId,
    action,
    details,
    type: 'PLAN_STATUS_CHANGE'
  };

  writeAuditLog(logEntry);
}

/**
 * Log plan creation
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 * @param {string} status - Plan status (active/disabled)
 * @param {boolean} isMockGenerated - Whether suggestions are mock-generated
 */
function logPlanCreation(userId, planId, status, isMockGenerated = false) {
  logPlanStatusChange(userId, planId, 'CREATE', {
    status,
    isMockGenerated
  });
}

/**
 * Log plan activation
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 * @param {string} previousActivePlanId - Previous active plan ID (if any)
 */
function logPlanActivation(userId, planId, previousActivePlanId = null) {
  logPlanStatusChange(userId, planId, 'ACTIVATE', {
    previousActivePlanId
  });
}

/**
 * Log plan deactivation
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 */
function logPlanDeactivation(userId, planId) {
  logPlanStatusChange(userId, planId, 'DEACTIVATE', {});
}

/**
 * Log plan deletion
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 */
function logPlanDeletion(userId, planId) {
  logPlanStatusChange(userId, planId, 'DELETE', {});
}

/**
 * Log suggestion regeneration
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 * @param {boolean} isMockGenerated - Whether new suggestions are mock-generated
 */
function logSuggestionRegeneration(userId, planId, isMockGenerated = false) {
  logPlanStatusChange(userId, planId, 'REGENERATE_SUGGESTIONS', {
    isMockGenerated
  });
}

/**
 * Write audit log entry to file
 * @param {Object} logEntry - Log entry object
 */
function writeAuditLog(logEntry) {
  try {
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(AUDIT_LOG_FILE, logLine, 'utf8');
  } catch (error) {
    console.error('Error writing audit log:', error.message);
  }
}

/**
 * Get audit logs for a specific user
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of logs to return
 * @returns {Array} Audit log entries
 */
function getAuditLogsForUser(userId, limit = 100) {
  try {
    if (!fs.existsSync(AUDIT_LOG_FILE)) {
      return [];
    }

    const content = fs.readFileSync(AUDIT_LOG_FILE, 'utf8');
    const lines = content.trim().split('\n');

    const logs = lines
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(log => log && log.userId === userId)
      .slice(-limit);

    return logs;
  } catch (error) {
    console.error('Error reading audit logs:', error.message);
    return [];
  }
}

/**
 * Get audit logs for a specific plan
 * @param {string} planId - Plan ID
 * @param {number} limit - Maximum number of logs to return
 * @returns {Array} Audit log entries
 */
function getAuditLogsForPlan(planId, limit = 100) {
  try {
    if (!fs.existsSync(AUDIT_LOG_FILE)) {
      return [];
    }

    const content = fs.readFileSync(AUDIT_LOG_FILE, 'utf8');
    const lines = content.trim().split('\n');

    const logs = lines
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(log => log && log.planId === planId)
      .slice(-limit);

    return logs;
  } catch (error) {
    console.error('Error reading audit logs:', error.message);
    return [];
  }
}

module.exports = {
  logPlanStatusChange,
  logPlanCreation,
  logPlanActivation,
  logPlanDeactivation,
  logPlanDeletion,
  logSuggestionRegeneration,
  getAuditLogsForUser,
  getAuditLogsForPlan
};
