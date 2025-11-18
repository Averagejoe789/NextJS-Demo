import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
	try {
		// Try to use service account credentials from environment variable
		const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
		
		if (serviceAccountJson) {
			// Parse the JSON string from environment variable
			const serviceAccount = JSON.parse(serviceAccountJson);
			admin.initializeApp({
				credential: admin.credential.cert(serviceAccount),
				projectId: serviceAccount.project_id || 'menuai-d0ab5',
			});
		} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
			// Use the path to service account key file
			admin.initializeApp({
				credential: admin.credential.applicationDefault(),
				projectId: 'menuai-d0ab5',
			});
		} else {
			// Fallback: try to use application default credentials
			// This will work if gcloud is configured locally
			admin.initializeApp({
				credential: admin.credential.applicationDefault(),
				projectId: 'menuai-d0ab5',
			});
		}
	} catch (error) {
		console.error('❌ Error initializing Firebase Admin:', error);
		throw new Error('Failed to initialize Firebase Admin SDK. Please check your credentials configuration.');
	}
}

export async function POST(req) {
	// Get URL and parse query parameters
	const url = new URL(req.url);
	const queryRestaurantId = url.searchParams.get('restaurantId');
	const queryChatId = url.searchParams.get('chatId');

	const contentType = req.headers.get('content-type') || '';
	let body = {};
	
	// Only parse JSON body if Content-Type is application/json
	if (contentType.includes('application/json')) {
		try {
			body = await req.json();
		} catch {
			// If JSON parsing fails but we have query params, continue
			if (!queryRestaurantId || !queryChatId) {
				return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json; charset=utf-8' },
				});
			}
		}
	}

	const messageText = body?.text || body?.message || '';
	// Get restaurantId and chatId from query params first, then fallback to body
	const restaurantId = queryRestaurantId || body?.restaurantId;
	const chatId = queryChatId || body?.chatId;

	if (!messageText || typeof messageText !== 'string' || messageText.trim() === '') {
		return new Response(
			JSON.stringify({ error: 'Message text is required' }),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			}
		);
	}

	if (!restaurantId || typeof restaurantId !== 'string' || restaurantId.trim() === '') {
		return new Response(
			JSON.stringify({ error: 'restaurantId is required' }),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			}
		);
	}

	if (!chatId || typeof chatId !== 'string' || chatId.trim() === '') {
		return new Response(
			JSON.stringify({ error: 'chatId is required' }),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			}
		);
	}

	// Save message to Firestore using Admin SDK
	try {
		const db = admin.firestore();
		const messagesRef = db
			.collection('restaurants')
			.doc(restaurantId.trim())
			.collection('chatSessions')
			.doc(chatId.trim())
			.collection('messages');
		
		// Save user message
		const userDocRef = await messagesRef.add({
			text: messageText.trim(),
			timestamp: admin.firestore.FieldValue.serverTimestamp()
		});
		console.log('✅ User message saved to Firestore:', userDocRef.id);
		
		return new Response(
			JSON.stringify({ success: true, messageId: userDocRef.id }),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			}
		);
	} catch (firestoreError) {
		console.error('❌ Error saving to Firestore:', firestoreError);
		console.error('Error details:', {
			code: firestoreError.code,
			message: firestoreError.message,
			stack: firestoreError.stack
		});
		
		return new Response(
			JSON.stringify({ error: 'Failed to save message', details: firestoreError.message }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			}
		);
	}
}
