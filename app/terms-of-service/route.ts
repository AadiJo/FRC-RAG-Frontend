import fs from 'fs/promises';

export async function GET() {
  const path = process.cwd() + '/public/terms.txt';
  try {
    const body = await fs.readFile(path, 'utf8');
    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    return new Response('Not found', { status: 404 });
  }
}
