import dbConnect from '@/lib/db';
import ActivityLog from '@/models/ActivityLog';

/**
 * Log an activity to the database
 * @param {Object} params - Activity parameters
 * @param {string} params.userId - User ID who performed the action
 * @param {string} params.action - Action type (e.g., 'INVOICE_CREATED')
 * @param {string} params.entityType - Entity type (e.g., 'invoice', 'business')
 * @param {string} params.entityId - Entity ID
 * @param {Object} params.details - Additional details about the action
 * @param {string} params.ipAddress - IP address of the user
 * @param {string} params.userAgent - User agent string
 */
export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  details = {},
  ipAddress = '',
  userAgent = '',
}) {
  try {
    await dbConnect();
    
    await ActivityLog.create({
      userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    // Log error but don't throw - activity logging should not break main flow
    console.error('Activity logging error:', error);
  }
}

/**
 * Get request metadata for logging
 * @param {Request} request - Next.js request object
 * @returns {Object} - IP address and user agent
 */
export function getRequestMeta(request) {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '',
    userAgent: request.headers.get('user-agent') || '',
  };
}

/**
 * Get recent activities for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of activities to return
 * @returns {Promise<Array>} - Array of activity logs
 */
export async function getUserActivities(userId, limit = 50) {
  try {
    await dbConnect();
    
    const activities = await ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    return activities;
  } catch (error) {
    console.error('Get activities error:', error);
    return [];
  }
}

/**
 * Get activities for an entity
 * @param {string} entityType - Entity type
 * @param {string} entityId - Entity ID
 * @param {number} limit - Number of activities to return
 * @returns {Promise<Array>} - Array of activity logs
 */
export async function getEntityActivities(entityType, entityId, limit = 50) {
  try {
    await dbConnect();
    
    const activities = await ActivityLog.find({ entityType, entityId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name email')
      .lean();
    
    return activities;
  } catch (error) {
    console.error('Get entity activities error:', error);
    return [];
  }
}

/**
 * Get all activities (admin only)
 * @param {Object} filters - Filter options
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} - Activities and pagination info
 */
export async function getAllActivities(filters = {}, page = 1, limit = 50) {
  try {
    await dbConnect();
    
    const query = {};
    
    if (filters.action) query.action = filters.action;
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.userId) query.userId = filters.userId;
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const [activities, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean(),
      ActivityLog.countDocuments(query),
    ]);
    
    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Get all activities error:', error);
    return { activities: [], pagination: { page: 1, limit, total: 0, pages: 0 } };
  }
}
