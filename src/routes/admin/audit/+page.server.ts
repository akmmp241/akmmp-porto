import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { auditLog, authUser } from '$lib/server/db/schema';
import { eq, desc, count, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!locals.user) throw redirect(302, '/admin/login');

	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
	const limit = 50;
	const offset = (page - 1) * limit;

	const actionFilter = url.searchParams.get('action') || undefined;

	let whereClause = undefined;
	if (actionFilter) {
		whereClause = eq(auditLog.action, actionFilter);
	}

	const logs = await db
		.select({
			id: auditLog.id,
			action: auditLog.action,
			target: auditLog.target,
			metadata: auditLog.metadata,
			ipAddress: auditLog.ipAddress,
			createdAt: auditLog.createdAt,
			userEmail: authUser.email,
			userName: authUser.name
		})
		.from(auditLog)
		.leftJoin(authUser, eq(auditLog.userId, authUser.id))
		.where(whereClause)
		.orderBy(desc(auditLog.createdAt))
		.limit(limit)
		.offset(offset);

	const [totalCountResult] = await db
		.select({ c: count() })
		.from(auditLog)
		.where(whereClause);
	
	const totalLogs = totalCountResult?.c || 0;
	const totalPages = Math.ceil(totalLogs / limit);

	// Get list of unique action types for filter dropdown
	const distinctActions = await db
		.select({ action: auditLog.action })
		.from(auditLog)
		.groupBy(auditLog.action);

	return {
		logs,
		distinctActions: distinctActions.map(a => a.action),
		selectedAction: actionFilter || '',
		pagination: {
			page,
			limit,
			totalLogs,
			totalPages
		}
	};
};
