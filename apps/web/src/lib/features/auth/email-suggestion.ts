export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

const COMMON_DOMAIN_TYPOS: Record<string, string> = {
	'gmail.conm': 'gmail.com',
	'gmail.cmo': 'gmail.com',
	'gmail.con': 'gmail.com',
	'gmail.co': 'gmail.com',
	'gmail.cm': 'gmail.com',
	'gmai.com': 'gmail.com',
	'gamil.com': 'gmail.com',
	'gmial.com': 'gmail.com',
	'gmaill.com': 'gmail.com',
	'hotmail.conm': 'hotmail.com',
	'hotmail.cmo': 'hotmail.com',
	'hotmail.con': 'hotmail.com',
	'hotmial.com': 'hotmail.com',
	'hotamil.com': 'hotmail.com',
	'outlook.conm': 'outlook.com',
	'outlook.cmo': 'outlook.com',
	'outlook.con': 'outlook.com',
	'outlok.com': 'outlook.com',
	'yahoo.conm': 'yahoo.com',
	'yahoo.cmo': 'yahoo.com',
	'yahoo.con': 'yahoo.com',
	'yaho.com': 'yahoo.com',
	'icloud.conm': 'icloud.com',
	'icloud.cmo': 'icloud.com',
	'icloud.con': 'icloud.com'
};

export interface EmailSuggestionResult {
	suggestedEmail: string | null;
	warning: string | null;
	isKnownTypo: boolean;
}

export function detectEmailTypo(email: string): EmailSuggestionResult {
	const normalized = normalizeEmail(email);
	const atIndex = normalized.lastIndexOf('@');
	if (atIndex <= 0 || atIndex === normalized.length - 1) {
		return { suggestedEmail: null, warning: null, isKnownTypo: false };
	}

	const userPart = normalized.slice(0, atIndex);
	const domainPart = normalized.slice(atIndex + 1);

	// Direct match in dictionary
	if (COMMON_DOMAIN_TYPOS[domainPart]) {
		const fixedDomain = COMMON_DOMAIN_TYPOS[domainPart];
		const suggested = `${userPart}@${fixedDomain}`;
		return {
			suggestedEmail: suggested,
			warning: `Você quis dizer ${suggested}?`,
			isKnownTypo: true
		};
	}

	// Generic TLD typo checks:
	if (domainPart.endsWith('.conm')) {
		const fixedDomain = domainPart.replace(/\.conm$/, '.com');
		const suggested = `${userPart}@${fixedDomain}`;
		return {
			suggestedEmail: suggested,
			warning: `Você quis dizer ${suggested}?`,
			isKnownTypo: true
		};
	}

	if (domainPart.endsWith('.cmo')) {
		const fixedDomain = domainPart.replace(/\.cmo$/, '.com');
		const suggested = `${userPart}@${fixedDomain}`;
		return {
			suggestedEmail: suggested,
			warning: `Você quis dizer ${suggested}?`,
			isKnownTypo: true
		};
	}

	return { suggestedEmail: null, warning: null, isKnownTypo: false };
}
