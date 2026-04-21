import {
	ExistingBusinessCaseSummary,
	IrishLifeClaimsSnapshot,
	NewBusinessCaseSummary,
} from '@core/services/irish-life-case.service';

type IrishLifeCaseSummaryLike = Pick<
	NewBusinessCaseSummary | ExistingBusinessCaseSummary,
	'customerGivenName' | 'customerFamilyName' | 'customerBirthDate' | 'customerAddress' | 'failureReason' | 'validation'
>;

export type ValidationDetail = {
  label: string;
  expected: string;
  actual: string;
};

type ValidationFieldConfig = {
	label: string;
	flag:
		| 'matchedGivenName'
		| 'matchedFamilyName'
		| 'matchedBirthDate'
		| 'matchedAddress';
	expected: keyof Pick<NewBusinessCaseSummary, 'customerGivenName' | 'customerFamilyName' | 'customerBirthDate' | 'customerAddress'>;
	actual: keyof Pick<IrishLifeClaimsSnapshot, 'givenName' | 'familyName' | 'birthDate' | 'address'>;
	reason: string;
};

const MISSING_DISCLOSED_VALUE = 'No value was disclosed by the wallet.';
const MISSING_EXPECTED_VALUE = 'No application value was provided.';
const NON_BLOCKING_FAILURE_PATTERNS = [
	/completion email was not sent/i,
	/backend did not report a completion email/i,
	/email was not sent by the backend/i,
];
const VALIDATION_FIELDS: ValidationFieldConfig[] = [
	{
		label: 'Given name',
		flag: 'matchedGivenName',
		expected: 'customerGivenName',
		actual: 'givenName',
		reason: 'Given name did not match the application.',
	},
	{
		label: 'Family name',
		flag: 'matchedFamilyName',
		expected: 'customerFamilyName',
		actual: 'familyName',
		reason: 'Family name did not match the application.',
	},
	{
		label: 'Birth date',
		flag: 'matchedBirthDate',
		expected: 'customerBirthDate',
		actual: 'birthDate',
		reason: 'Birth date did not match the application.',
	},
	{
		label: 'Address',
		flag: 'matchedAddress',
		expected: 'customerAddress',
		actual: 'address',
		reason: 'Address did not match the application.',
	},
];

export function buildValidationDetails (summary: IrishLifeCaseSummaryLike): ValidationDetail[] {
	const {validation} = summary;
	if (!validation) {
		return [];
	}

	const snapshot = validation.claimsSnapshot;

	return [
		...VALIDATION_FIELDS.flatMap((field) => {
			if (validation[field.flag] !== false) {
				return [];
			}

			return [{
				label: field.label,
				expected: displayExpected(summary[field.expected]),
				actual: displayActual(snapshotValue(snapshot, field.actual)),
			}];
		}),
		...buildExpiryDetail(validation.credentialExpired, snapshot),
	];
}

export function buildFailureReasons (summary: IrishLifeCaseSummaryLike): string[] {
	const {failureReason, validation} = summary;
	if (!validation) {
		return filterNonBlockingReasons(failureReason ? [failureReason] : []);
	}

	const reasons = VALIDATION_FIELDS.flatMap((field) => {
		if (validation[field.flag] !== false) {
			return [];
		}

		const actualValue = snapshotValue(validation.claimsSnapshot, field.actual);
		if (!actualValue) {
			return [`${field.label} was not disclosed by the wallet.`];
		}

		return [field.reason];
	});

	if (validation.credentialExpired) {
		reasons.push('The presented PID is expired.');
	}

	return reasons.length > 0 ? reasons : filterNonBlockingReasons(failureReason ? [failureReason] : []);
}

export function hasOnlyNonBlockingFailure (summary: IrishLifeCaseSummaryLike): boolean {
	const rawReason = typeof summary.failureReason === 'string' ? summary.failureReason.trim() : '';
	if (!rawReason) {
		return false;
	}

	if (filterNonBlockingReasons([rawReason]).length > 0) {
		return false;
	}

	const validation = summary.validation;
	if (!validation) {
		return false;
	}

	return validation.matchedGivenName !== false &&
		validation.matchedFamilyName !== false &&
		validation.matchedBirthDate !== false &&
		validation.matchedAddress !== false &&
		validation.credentialExpired !== true;
}

export function disclosedClaimPathsFromSummary (summary: IrishLifeCaseSummaryLike): string[] {
	return snapshotStringArray(summary.validation?.claimsSnapshot, 'disclosedClaimPaths');
}

function snapshotValue (
	snapshot: IrishLifeClaimsSnapshot | undefined,
	key: keyof IrishLifeClaimsSnapshot
): string {
	if (!snapshot) {
		return '';
	}

	const value = snapshot[key];
	return typeof value === 'string' ? value.trim() : '';
}

function snapshotStringArray (
	snapshot: IrishLifeClaimsSnapshot | undefined,
	key: keyof IrishLifeClaimsSnapshot
): string[] {
	const value = snapshot?.[key];
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
}

function displayExpected (value: string): string {
	return value.trim() || MISSING_EXPECTED_VALUE;
}

function displayActual (value: string): string {
	return value || MISSING_DISCLOSED_VALUE;
}

function buildExpiryDetail (
	credentialExpired: boolean | undefined,
	snapshot: IrishLifeClaimsSnapshot | undefined
): ValidationDetail[] {
	if (!credentialExpired) {
		return [];
	}

	return [{
		label: 'Credential expiry',
		expected: 'A current PID credential',
		actual: displayActual(snapshotValue(snapshot, 'expiry')),
	}];
}

function filterNonBlockingReasons (reasons: string[]): string[] {
	return reasons.filter((reason) => !NON_BLOCKING_FAILURE_PATTERNS.some((pattern) => pattern.test(reason)));
}