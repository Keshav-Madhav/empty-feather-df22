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

app.post('/chatWithDoc', async (c)=>{
	const openai = new OpenAI({
		apiKey: c.env.OPEN_AI_KEY,
	})

	const { docData, question } = await c.req.json();

	const chatCompletion = await openai.chat.completions.create({
		messages:[
			{
				role:	'system',
				content: 'You are a assistant helping user to chat with a document, I am providing a JSON file of the markdown for the document. Using this, answer the users question in the clearest way possible. Do not answer any question which is not related to the document. The document markdown JSON is: ' + docData,
			}, {
				role: 'user',
				content: 'User question is: ' + question,
			},
		],
		model: 'gpt-4o-mini',
		temperature: 0.5,
	})

	const response = chatCompletion.choices[0].message.content;

	return c.json({ message: response });
})