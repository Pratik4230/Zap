/**
 * Welcome to Cloudflare Workers! This is your analytics-worker (Queue Consumer).
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Run `npm run deploy` to publish your worker
 */

export interface Env {
	DB: D1Database;
}

export default {
	async queue(batch: MessageBatch<any>, env: Env, ctx: ExecutionContext): Promise<void> {
		console.log(`[analytics-worker] Received a batch of ${batch.messages.length} messages`);
		for (const message of batch.messages) {
			console.log(`Processing event:`, message.body);
			// TODO: Write event to D1 database
		}
	},
} satisfies ExportedHandler<Env>;
