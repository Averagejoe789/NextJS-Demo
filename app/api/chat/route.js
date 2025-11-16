export async function GET() {
	return new Response('Hello world', {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
}


export async function POST(req) {
	const contentType = req.headers.get('content-type') || '';
	if (!contentType.includes('application/json')) {
		return new Response(
			JSON.stringify({ error: 'Content-Type must be application/json' }),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			}
		);
	}

	let body;
	try {
		body = await req.json();
	} catch {
		return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
		});
	}

	const value = body?.number;
	if (typeof value !== 'number' || Number.isNaN(value)) {
		return new Response(
			JSON.stringify({ error: 'Field "number" must be a valid number' }),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			}
		);
	}

	const result = value + 2;
	return new Response(JSON.stringify({ result }), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}
