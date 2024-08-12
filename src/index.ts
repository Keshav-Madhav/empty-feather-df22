import { Hono } from 'hono';
import { cors } from 'hono/cors';
import OpenAI from 'openai';

type Bindings = {
	OPEN_AI_KEY: string;
	AI: Ai;
};

const app = new Hono<{Bindings: Bindings}>();

app.use(
	'/*',
	cors({
		origin: '*',
		allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests', 'Content-Type'],
		allowMethods: ['GET', 'POST', 'OPTIONS', 'PUT'],
		exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
		maxAge: 600,
		credentials: true,
	})
)

app.post('/translateDoc', async (c)=>{
	const { docData, targetLang } = await c.req.json();

	const summaryRes = await c.env.AI.run('@cf/facebook/bart-large-cnn', {
		input_text: docData,
		max_length: 1000,
	})

	const response = await c.env.AI.run('@cf/meta/m2m100-1.2b',{
		text: summaryRes.summary,
		source_lang: 'english',
		target_lang: targetLang,
	})

	return new Response(JSON.stringify(response));
})

export default app;