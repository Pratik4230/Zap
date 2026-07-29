import { runHealthMonitor } from '@xaply/db';
import { logError, logEvent } from '@xaply/db';

interface HealthCronEnv {
	DB: D1Database;
	ZAP_CACHE: KVNamespace;
	RESEND_API_KEY?: string;
	ADMIN_EMAIL?: string;
}

export async function runHealthMonitorCron(env: HealthCronEnv): Promise<void> {
	try {
		const results = await runHealthMonitor(env);
		const failed = results.filter((result) => !result.ok);

		if (failed.length > 0) {
			logEvent({
				event: 'health.unhealthy',
				level: 'warn',
				worker: 'xaply-redirect',
				failed,
			});
			return;
		}

		logEvent({
			event: 'health.ok',
			worker: 'xaply-redirect',
			services: results.map((result) => result.service),
		});
	} catch (error) {
		logError('health.cron_failed', error, { worker: 'xaply-redirect' });
	}
}
