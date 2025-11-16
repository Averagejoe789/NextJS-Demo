import { firebaseApiKey } from '../firebase-config/firebase';

function parseCookies(cookieHeader) {
	if (!cookieHeader) return {};
	return cookieHeader.split(';').reduce((acc, part) => {
		const [name, ...rest] = part.split('=');
		if (!name) return acc;
		const key = name.trim();
		const value = decodeURIComponent(rest.join('=').trim() || '');
		acc[key] = value;
		return acc;
	}, {});
}

function buildSetCookie(name, value, options = {}) {
	const {
		httpOnly = true,
		secure = true,
		path = '/',
		sameSite = 'Lax',
		maxAge, // seconds
	} = options;
	const segments = [`${name}=${encodeURIComponent(value)}`];
	if (maxAge != null) segments.push(`Max-Age=${maxAge}`);
	if (path) segments.push(`Path=${path}`);
	if (sameSite) segments.push(`SameSite=${sameSite}`);
	if (secure) segments.push('Secure');
	if (httpOnly) segments.push('HttpOnly');
	return segments.join('; ');
}

async function createAnonymousUser() {
	const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`;
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ returnSecureToken: true }),
	});
	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Anonymous signUp failed: ${res.status} ${err}`);
	}
	const data = await res.json();
	// data: { idToken, refreshToken, expiresIn, localId, ... }
	return { idToken: data.idToken, uid: data.localId };
}

async function ensureAnonymousSession(req) {
	const cookies = parseCookies(req.headers.get('cookie') || '');
	const existingIdToken = cookies['anonIdToken'];
	const existingUid = cookies['anonUid'];
	if (existingIdToken && existingUid) {
		return { created: false, idToken: existingIdToken, uid: existingUid, setCookieHeaders: [] };
	}
	const { idToken, uid } = await createAnonymousUser();
	const oneWeek = 7 * 24 * 60 * 60; // seconds
	const cookieHeaders = [
		buildSetCookie('anonIdToken', idToken, { maxAge: oneWeek }),
		buildSetCookie('anonUid', uid, { maxAge: oneWeek }),
	];
	return { created: true, idToken, uid, setCookieHeaders: cookieHeaders };
}

export async function GET(req) {
	const session = await ensureAnonymousSession(req);
	const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8' });
	for (const sc of session.setCookieHeaders) headers.append('Set-Cookie', sc);
	const payload = session.created ? { ok: true, anonCreated: true, uid: session.uid } : { ok: true };
	return new Response(JSON.stringify(payload), { headers });
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

	const session = await ensureAnonymousSession(req);
	const result = value + 2;
	const payload = session.created ? { result, anonCreated: true, uid: session.uid } : { result };
	const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8' });
	for (const sc of session.setCookieHeaders) headers.append('Set-Cookie', sc);
	return new Response(JSON.stringify(payload), { headers });
}
