/**
 * The session portal each workspace's inbox pages read and ack with. The header bell derives its portal from
 * CANONICAL_LMS_WORKSPACE_ROUTES (notificationPortalFromPath); a test pins these constants to it, so the bell badge
 * and the inbox share one query root.
 */
export const ADMIN_NOTIFICATION_PORTAL = "lcms" as const;
export const TEACHER_NOTIFICATION_PORTAL = "lms" as const;
