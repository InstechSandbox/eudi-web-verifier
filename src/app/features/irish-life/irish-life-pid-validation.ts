/* eslint-disable max-statements */

import {
	IrishLifeCasePartyDetails,
	IrishLifeValidationSummary,
} from '@core/services/irish-life-case.service';

type PidPayload = Record<string, unknown>;

export function buildIrishLifePidValidation (
	expected: IrishLifeCasePartyDetails,
	payload: PidPayload
): IrishLifeValidationSummary {
	const givenName = stringOf(payload['given_name']);
	const familyName = stringOf(payload['family_name']);
	const birthDate = stringOf(payload['birthdate'] ?? payload['birth_date']);
	const address = extractAddress(payload);
	const expiry = stringOf(payload['date_of_expiry'] ?? payload['expiry_date']);
	const credentialExpired = isExpired(expiry);

	const validation: IrishLifeValidationSummary = {
		matchedGivenName: matches(givenName, expected.customerGivenName),
		matchedFamilyName: matches(familyName, expected.customerFamilyName),
		matchedBirthDate: birthDate === expected.customerBirthDate,
		matchedAddress: addressMatches(address, expected.customerAddress),
		credentialExpired,
		credentialExpiry: expiry,
		claimsSnapshot: {
			givenName,
			familyName,
			birthDate,
			address,
			expiry,
		},
	};

	validation.reason = collectIrishLifePidValidationReasons(validation).join(' ');
	return validation;
}

export function collectIrishLifePidValidationReasons (
	validation: IrishLifeValidationSummary
): string[] {
	const reasons: string[] = [];

	if (!validation.matchedGivenName) {
		reasons.push('Given name did not match the application.');
	}
	if (!validation.matchedFamilyName) {
		reasons.push('Family name did not match the application.');
	}
	if (!validation.matchedBirthDate) {
		reasons.push('Birth date did not match the application.');
	}
	if (!validation.matchedAddress) {
		reasons.push('Address did not match the application.');
	}
	if (validation.credentialExpired) {
		reasons.push('The presented PID is expired.');
	}

	return reasons;
}

function extractAddress (payload: PidPayload): string {
	const address = payload['address'];

	if (typeof address === 'string') {
		return address;
	}

	if (isObject(address) && typeof address['formatted'] === 'string') {
		return address['formatted'];
	}

	if (!isObject(address)) {
		return '';
	}

	return [
		address['street_address'],
		address['locality'],
		address['region'],
		address['postal_code'],
	]
		.map((value) => stringOf(value))
		.filter((value) => value.length > 0)
		.join(', ');
}

function addressMatches (left: string, right: string): boolean {
	return normalize(left) === normalize(right) || normalizeAddressCompact(left) === normalizeAddressCompact(right);
}

function matches (left: string, right: string): boolean {
	return normalize(left) === normalize(right);
}

function normalize (value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function normalizeAddressCompact (value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '');
}

function stringOf (value: unknown): string {
	return typeof value === 'string' ? value : '';
}

function isObject (value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isExpired (expiry: string): boolean {
	if (!expiry) {
		return true;
	}

	const parsed = new Date(expiry);
	if (Number.isNaN(parsed.getTime())) {
		return true;
	}

	return parsed.getTime() < Date.now();
}