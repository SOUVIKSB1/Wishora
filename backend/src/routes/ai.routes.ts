import { FastifyInstance } from 'fastify';
import { generateWishSuggestions, generatePhotoCaptions } from '../services/ai.service.js';

export async function aiRoutes(fastify: FastifyInstance) {
  fastify.post('/ai/suggest-wish', async (req, reply) => {
    const body = req.body as any;
    if (!body || !body.name) {
      return reply.code(400).send({ error: 'Recipient name is required' });
    }

    try {
      const suggestions = await generateWishSuggestions({
        name: body.name,
        age: body.age ? parseInt(body.age, 10) : 25,
        gender: body.gender || 'unspecified',
        relationship: body.relationship || 'Friend',
        language: body.language || 'en',
        tone: body.tone
      });

      return { suggestions };
    } catch (e: any) {
      return reply.code(500).send({ error: 'AI generation failed', message: e.message });
    }
  });

  fastify.post('/ai/generate-captions', async (req, reply) => {
    const body = req.body as any;
    const name = body?.name || 'Friend';
    const count = Math.min(20, Math.max(1, parseInt(body?.count || 1, 10)));

    try {
      const captions = await generatePhotoCaptions({
        name,
        relationship: body?.relationship || 'Friend',
        age: body?.age ? parseInt(body.age, 10) : 25,
        gender: body?.gender || 'unspecified',
        theme: body?.theme || 'auto',
        count
      });

      return { captions };
    } catch (e: any) {
      return reply.code(500).send({ error: 'AI caption generation failed', message: e.message });
    }
  });
}
