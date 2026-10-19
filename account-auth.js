const AUTH_PROJECT_URL = 'https://dkgjdrlsdmjnljwbmcft.supabase.co';
const AUTH_PUBLIC_KEY = 'sb_publishable_lJTLDmJwUkNFoCYqBJI6Eg_pPXIGf_B';

const PROTECTED_COURSE_PAGES = new Set([
	'intermediate-1st-year.html',
	'intermediate-2nd-year.html',
	'lawcet.html',
	'llb.html',
	'materials.html'
]);

const supabaseClient = window.supabase?.createClient(AUTH_PROJECT_URL, AUTH_PUBLIC_KEY);
window.yscaSupabase = supabaseClient || null;

window.yscaGetProtectedReturnPath = function (value) {
	if (!value) return '';

	try {
		const destination = new URL(value, window.location.href);
		const fileName = destination.pathname.split('/').pop();
		if (destination.origin !== window.location.origin || !PROTECTED_COURSE_PAGES.has(fileName)) return '';
		return `${fileName}${destination.search}${destination.hash}`;
	} catch {
		return '';
	}
};

function accountHomeUrl(returnPath, errorCode = '') {
	const url = new URL('index.html', window.location.href);
	if (returnPath) url.searchParams.set('returnTo', returnPath);
	if (errorCode) url.searchParams.set('authError', errorCode);
	return url.href;
}

async function guardCoursePage() {
	if (document.body.dataset.requireAuth !== 'true') return;

	const returnPath = `${window.location.pathname.split('/').pop()}${window.location.search}${window.location.hash}`;
	if (!supabaseClient) {
		window.location.replace(accountHomeUrl(returnPath, 'service-unavailable'));
		return;
	}

	try {
		const { data, error } = await supabaseClient.auth.getSession();
		if (error) throw error;

		if (!data.session) {
			window.location.replace(accountHomeUrl(returnPath));
			return;
		}

		const { data: userData, error: userError } = await supabaseClient.auth.getUser();
		if (userError) throw userError;
		if (!userData.user) {
			window.location.replace(accountHomeUrl(returnPath));
			return;
		}

		document.body.classList.remove('auth-guard-pending');
	} catch {
		window.location.replace(accountHomeUrl(returnPath, 'session-check-failed'));
	}
}

void guardCoursePage();
