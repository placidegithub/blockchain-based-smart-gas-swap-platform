interface HttpSmsResult {
  id?: string;
  status?: string;
  [key: string]: unknown;
}

function isConfiguredSecret(value?: string): boolean {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;

  return !(
    normalized.startsWith('your_') ||
    normalized.includes('example') ||
    normalized.includes('placeholder')
  );
}

export function hasHttpSmsConfig(): boolean {
  return isConfiguredSecret(process.env.HTTPSMS_API_KEY) && isConfiguredSecret(process.env.HTTPSMS_FROM);
}

export function formatRwandaPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.startsWith('+250')) return cleaned;
  if (cleaned.startsWith('0')) return `+250${cleaned.substring(1)}`;
  if (cleaned.startsWith('250')) return `+${cleaned}`;
  return `+250${cleaned}`;
}

export async function sendHttpSms(to: string, content: string): Promise<HttpSmsResult> {
  if (!hasHttpSmsConfig()) {
    throw new Error('httpSMS credentials are not configured');
  }

  const response = await fetch('https://api.httpsms.com/v1/messages/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.HTTPSMS_API_KEY as string,
    },
    body: JSON.stringify({
      content,
      from: process.env.HTTPSMS_FROM,
      to: formatRwandaPhoneNumber(to),
    }),
  });

  const responseText = await response.text();
  let result: HttpSmsResult = {};

  if (responseText) {
    try {
      result = JSON.parse(responseText) as HttpSmsResult;
    } catch {
      result = { message: responseText };
    }
  }

  if (!response.ok) {
    const message =
      typeof result.message === 'string'
        ? result.message
        : `httpSMS request failed with status ${response.status}`;
    throw new Error(message);
  }

  return result;
}
