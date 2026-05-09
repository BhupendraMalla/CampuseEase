/**
 * Role-Based Authorization Middleware
 * Provides authorization checks for different roles and departments
 */

// Role hierarchy and permissions
const ROLE_PERMISSIONS = {
  'super-admin': {
    canCreateUsers: ['student', 'faculty', 'secretary', 'admin', 'hod', 'principal', 'coordinator', 'director', 'it-officer', 'graphic-designer', 'receptionist', 'operations-officer', 'finance-officer'],
    canDeleteUsers: ['any'],
    canViewStudents: true,
    canViewAssets: true,
    canViewFees: true,
    canEntryMarks: false,
    accessAllDepartments: true
  },
  'admin': {
    canCreateUsers: ['student', 'faculty', 'secretary'],
    canDeleteUsers: ['student', 'faculty', 'secretary'],
    canViewStudents: true,
    canViewAssets: false,
    canViewFees: false,
    canEntryMarks: false,
    accessAllDepartments: false
  },
  'principal': {
    canCreateUsers: false,
    canDeleteUsers: false,
    canViewStudents: true,
    canViewAssets: false,
    canViewFees: false,
    canEntryMarks: false,
    departmentRestricted: 'academic'
  },
  'coordinator': {
    canCreateUsers: false,
    canDeleteUsers: false,
    canViewStudents: true,
    canViewAssets: false,
    canViewFees: false,
    canEntryMarks: false,
    departmentRestricted: 'academic'
  },
  'hod': {
    canCreateUsers: false,
    canDeleteUsers: false,
    canViewStudents: true,
    canViewAssets: false,
    canViewFees: false,
    canEntryMarks: false,
    departmentRestricted: 'academic'
  },
  'director': {
    canCreateUsers: false,
    canDeleteUsers: false,
    canViewStudents: true,
    canViewAssets: false,
    canViewFees: false,
    canEntryMarks: false,
    departmentRestricted: 'academic'
  },
  'faculty': {
    canCreateUsers: false,
    canDeleteUsers: false,
    canViewStudents: true,
    canViewAssets: false,
    canViewFees: false,
    canEntryMarks: true,
    departmentRestricted: 'academic'
  },
  'it-officer': {
    canCreateUsers: false,
    canDeleteUsers: false,
    canViewStudents: true,
    canViewAssets: false,
    canViewFees: false,
    canEntryMarks: false,
    departmentRestricted: 'administration'
  },
  'graphic-designer': {
    canCreateUsers: false,
    canDeleteUsers: false,
    canViewStudents: true,
    canViewAssets: false,
    canViewFees: false,
    canEntryMarks: false,
    departmentRestricted: 'administration'
  },
  'receptionist': {
    canCreateUsers: false,
    canDeleteUsers: false,
    canViewStudents: true,
    canViewAssets: false,
    canViewFees: false,
    canEntryMarks: false,
    departmentRestricted: 'administration'
  },
  'operations-officer': {
    canCreateUsers: false,
    canDeleteUsers: false,
    canViewStudents: false,
    canViewAssets: true,
    canViewFees: false,
    canEntryMarks: false,
    departmentRestricted: 'operations'
  },
  'finance-officer': {
    canCreateUsers: false,
    canDeleteUsers: false,
    canViewStudents: true,
    canViewAssets: false,
    canViewFees: true,
    canEntryMarks: false,
    departmentRestricted: 'finance'
  },
  'secretary': {
    canCreateUsers: false,
    canDeleteUsers: false,
    canViewStudents: true,
    canViewAssets: false,
    canViewFees: false,
    canEntryMarks: false,
    departmentRestricted: 'administration'
  },
  'student': {
    canCreateUsers: false,
    canDeleteUsers: false,
    canViewStudents: false,
    canViewAssets: false,
    canViewFees: false,
    canEntryMarks: false,
    canViewOwnData: true
  }
};

/**
 * Check if user has specific role
 * @param {string} userRole - The role to check
 * @param {Array<string>} requiredRoles - Array of allowed roles
 * @returns {boolean}
 */
function hasRole(userRole, requiredRoles) {
  if (!Array.isArray(requiredRoles)) {
    requiredRoles = [requiredRoles];
  }
  return requiredRoles.includes(userRole) || userRole === 'super-admin';
}

/**
 * Middleware to verify role-based access
 * @param {Array<string>} allowedRoles - Roles allowed to access the endpoint
 * @returns {Function} Express middleware
 */
function verifyRole(allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({ message: 'User role not found in token' });
    }

    if (!hasRole(userRole, allowedRoles)) {
      return res.status(403).json({ 
        message: 'Access denied. Required role(s): ' + allowedRoles.join(', '),
        userRole: userRole
      });
    }

    next();
  };
}

/**
 * Middleware to verify department-based access
 * @param {string|Array} allowedDepartments - Department(s) allowed to access
 * @returns {Function} Express middleware
 */
function verifyDepartment(allowedDepartments) {
  return (req, res, next) => {
    const userDepartment = req.user?.department;
    const userRole = req.user?.role;

    // Super admin has access to all departments
    if (userRole === 'super-admin') {
      return next();
    }

    if (!userDepartment) {
      return res.status(401).json({ message: 'User department not found' });
    }

    const departments = Array.isArray(allowedDepartments) ? allowedDepartments : [allowedDepartments];

    if (!departments.includes(userDepartment)) {
      return res.status(403).json({ 
        message: 'Access denied. Required department(s): ' + departments.join(', '),
        userDepartment: userDepartment
      });
    }

    next();
  };
}

/**
 * Check if user can perform specific action
 * @param {string} userRole - User role
 * @param {string} action - Action to perform (canCreateUsers, canViewStudents, etc.)
 * @param {string|null} targetRole - Target role (for actions like canCreateUsers)
 * @returns {boolean}
 */
function canPerformAction(userRole, action, targetRole = null) {
  const permissions = ROLE_PERMISSIONS[userRole];

  if (!permissions) {
    return false;
  }

  if (userRole === 'super-admin') {
    return true;
  }

  const actionPermission = permissions[action];

  if (typeof actionPermission === 'boolean') {
    return actionPermission;
  }

  if (Array.isArray(actionPermission) && targetRole) {
    return actionPermission.includes('any') || actionPermission.includes(targetRole);
  }

  return false;
}

/**
 * Middleware to verify user can create specific user types
 * @param {Function} allowCustomCheck - Optional custom check function
 * @returns {Function} Express middleware
 */
function verifyCanCreateUser(allowCustomCheck) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    const targetRole = req.body?.role;

    if (!userRole) {
      return res.status(401).json({ message: 'User role not found' });
    }

    // Super admin can create any user
    if (userRole === 'super-admin') {
      return next();
    }

    if (!targetRole) {
      return res.status(400).json({ message: 'Target role not specified' });
    }

    if (!canPerformAction(userRole, 'canCreateUsers', targetRole)) {
      return res.status(403).json({ 
        message: `User with role '${userRole}' cannot create users with role '${targetRole}'`
      });
    }

    if (allowCustomCheck && !allowCustomCheck(req)) {
      return res.status(403).json({ message: 'Custom authorization check failed' });
    }

    next();
  };
}

/**
 * Get role permissions
 * @param {string} role - Role to get permissions for
 * @returns {Object} Role permissions
 */
function getPermissions(role) {
  return ROLE_PERMISSIONS[role] || null;
}

/**
 * Get all available roles
 * @returns {Array<string>} Array of all roles
 */
function getAllRoles() {
  return Object.keys(ROLE_PERMISSIONS);
}

/**
 * Get roles for a specific department
 * @param {string} department - Department name
 * @returns {Array<string>} Array of roles for the department
 */
function getRolesByDepartment(department) {
  const roleMap = {
    'academic': ['principal', 'coordinator', 'hod', 'director', 'faculty'],
    'administration': ['it-officer', 'graphic-designer', 'receptionist', 'secretary'],
    'operations': ['operations-officer'],
    'finance': ['finance-officer'],
    'general': ['student', 'admin', 'secretary']
  };

  return roleMap[department] || [];
}

module.exports = {
  verifyRole,
  verifyDepartment,
  canPerformAction,
  verifyCanCreateUser,
  getPermissions,
  getAllRoles,
  getRolesByDepartment,
  ROLE_PERMISSIONS
};
