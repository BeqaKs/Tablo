const TBC_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.tbcbank.ge' 
  : 'https://api.tbcbank.ge'; // They use the same URL for prod/sandbox, the keys dictate the env

interface TBCConfig {
    apiKey: string;
    clientId: string;
    clientSecret: string;
}

// In-memory cache for the access token to avoid round-trips for every request.
// In a serverless environment (Vercel), this may reset per cold start, 
// but it still saves time during burst usage on a warm instance.
let cachedToken: string | null = null;
let tokenExpiresAt: number | null = null;

const getConfig = (): TBCConfig => {
    const apiKey = process.env.TBC_API_KEY;
    const clientId = process.env.TBC_CLIENT_ID;
    const clientSecret = process.env.TBC_CLIENT_SECRET;

    if (!apiKey || !clientId || !clientSecret) {
        throw new Error('TBC API Credentials missing from environment');
    }

    return { apiKey, clientId, clientSecret };
};

export async function getTBCAccessToken(): Promise<string> {
    const config = getConfig();

    // Return cached token if it's still valid (adding a 5-minute buffer to be safe)
    if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
        return cachedToken;
    }

    const params = new URLSearchParams();
    params.append('client_id', config.clientId);
    params.append('client_secret', config.clientSecret);

    const res = await fetch(`${TBC_API_URL}/v1/tpay/access-token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            apikey: config.apiKey,
        },
        body: params,
        // Don't cache the token response in Next.js fetch cache because it's short-lived
        cache: 'no-store' 
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to fetch TBC access token: ${res.status} - ${errText}`);
    }

    const data = await res.json();
    cachedToken = data.access_token;
    
    // TBC access tokens usually expire in exactly 24 hours (86400 seconds)
    // We add it to the current timestamp. Data.expires_in usually dictates this.
    const expiresIn = parseInt(data.expires_in || '86400', 10);
    tokenExpiresAt = Date.now() + expiresIn * 1000;

    return cachedToken!;
}

interface CreatePaymentParams {
    amount: number;       // e.g. 5.50
    currency?: string;    // 'GEL'
    returnUrl: string;    // The absolute URL to redirect to after payment completion
    userIp?: string;
    methods?: number[];   // e.g. [5, 7, 8] for specific methods like card, apple pay, google pay. Or leave undefined for default.
    extra?: string;       // Custom info
}

export async function createTBCPayment(params: CreatePaymentParams) {
    const config = getConfig();
    const token = await getTBCAccessToken();

    const payload = {
        amount: {
            currency: params.currency || 'GEL',
            // Amount MUST be passed as a float string, e.g., "1.00"
            total: params.amount.toFixed(2), 
        },
        returnurl: params.returnUrl,
        userIpAddress: params.userIp || '127.0.0.1',
        methods: params.methods || [5, 7, 8], // 5=Card, 7=ApplePay, 8=GooglePay by default depending on merchant config
        extra: params.extra
    };

    const res = await fetch(`${TBC_API_URL}/v1/tpay/payments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': config.apiKey,
        },
        body: JSON.stringify(payload),
        cache: 'no-store'
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to create TBC Payment: ${res.status} - ${errText}`);
    }

    return res.json();
}

export async function getTBCPaymentDetails(payId: string) {
    const config = getConfig();
    const token = await getTBCAccessToken();

    const res = await fetch(`${TBC_API_URL}/v1/tpay/payments/${payId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': config.apiKey,
        },
        cache: 'no-store'
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to fetch TBC Payment Details for ${payId}: ${res.status} - ${errText}`);
    }

    return res.json();
}
