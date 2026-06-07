import { db } from './db';
import { auditLog } from './db/schema';

/**
 * Logs an administrative action into the audit_log table.
 */
export async function logAction(
	userId: string | null,
	action: string,
	target?: string,
	metadata: Record<string, unknown> = {},
	ipAddress?: string
): Promise<void> {
	try {
		await db.insert(auditLog).values({
			userId,
			action,
			target: target || null,
			metadata,
			ipAddress: ipAddress || null
		});
	} catch (error) {
		console.error('Failed to write audit log:', error);
	}
}
