const STUDENT_ACCOUNTS_KEY = 'ysCareerAcademyStudentAccounts';
const STUDENT_SESSION_KEY = 'ysCareerAcademyStudentSession';

const authPanel = document.querySelector('#authPanel');
const dashboard = document.querySelector('#studentDashboard');
const signupForm = document.querySelector('#signupForm');
const loginForm = document.querySelector('#loginForm');
const signupTab = document.querySelector('#signupTab');
const loginTab = document.querySelector('#loginTab');
const authMessage = document.querySelector('#authMessage');

function readAccounts() {
	return JSON.parse(localStorage.getItem(STUDENT_ACCOUNTS_KEY) || '{}');
}

function showMessage(message, type = 'error') {
	authMessage.textContent = message;
	authMessage.className = `student-auth-message is-${type}`;
}

function setMode(mode) {
	const isSignup = mode === 'signup';
	signupForm.hidden = !isSignup;
	loginForm.hidden = isSignup;
	signupTab.classList.toggle('is-active', isSignup);
	loginTab.classList.toggle('is-active', !isSignup);
	signupTab.setAttribute('aria-selected', String(isSignup));
	loginTab.setAttribute('aria-selected', String(!isSignup));
	document.querySelector('#authTitle').textContent = isSignup ? 'Create your account' : 'Welcome back';
	document.querySelector('#authDescription').textContent = isSignup
		? 'Join YS Career Academy to get started.'
		: 'Log in to continue your learning journey.';
	showMessage('');
}

function bytesToHex(bytes) {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, salt) {
	if (!window.crypto?.subtle || !window.crypto?.getRandomValues) {
		throw new Error('Secure password hashing is unavailable. Open this site over HTTPS or localhost.');
	}

	const data = new TextEncoder().encode(`${salt}:${password}`);
	const digest = await window.crypto.subtle.digest('SHA-256', data);
	return bytesToHex(new Uint8Array(digest));
}

function createSalt() {
	const bytes = window.crypto.getRandomValues(new Uint8Array(16));
	return bytesToHex(bytes);
}

function openDashboard(account) {
	authPanel.hidden = true;
	dashboard.hidden = false;
	document.querySelector('#dashboardTitle').textContent = `Welcome, ${account.name}!`;
	document.querySelector('#dashboardCourse').textContent = account.course;

	const courseLinks = {
		'Intermediate 1st Year': 'intermediate-1st-year.html',
		'Intermediate 2nd Year': 'intermediate-2nd-year.html',
		'LAWCET Preparation': 'lawcet.html',
		LLB: 'llb.html'
	};
	document.querySelector('#courseLink').href = courseLinks[account.course] || 'index.html#courses';
}

signupTab.addEventListener('click', () => setMode('signup'));
loginTab.addEventListener('click', () => setMode('login'));

signupForm.addEventListener('submit', async (event) => {
	event.preventDefault();
	showMessage('');

	if (!signupForm.reportValidity()) return;

	const formData = new FormData(signupForm);
	const name = formData.get('name').trim();
	const email = formData.get('email').trim().toLowerCase();
	const course = formData.get('course');
	const password = formData.get('password');
	const confirmPassword = formData.get('confirmPassword');

	if (password !== confirmPassword) {
		showMessage('Those passwords do not match. Please check and try again.');
		return;
	}

	try {
		const accounts = readAccounts();
		if (accounts[email]) {
			showMessage('An account with this email already exists. Log in instead.');
			return;
		}

		const salt = createSalt();
		accounts[email] = {
			name,
			email,
			course,
			salt,
			passwordHash: await hashPassword(password, salt)
		};
		localStorage.setItem(STUDENT_ACCOUNTS_KEY, JSON.stringify(accounts));
		sessionStorage.setItem(STUDENT_SESSION_KEY, email);
		openDashboard(accounts[email]);
	} catch (error) {
		showMessage(error instanceof Error && error.message.includes('Secure password hashing')
			? error.message
			: 'Your account could not be saved in this browser. Please enable local storage and try again.');
	}
});

loginForm.addEventListener('submit', async (event) => {
	event.preventDefault();
	showMessage('');

	if (!loginForm.reportValidity()) return;

	const formData = new FormData(loginForm);
	const email = formData.get('email').trim().toLowerCase();
	const password = formData.get('password');

	try {
		const account = readAccounts()[email];
		if (!account || await hashPassword(password, account.salt) !== account.passwordHash) {
			showMessage('Email or password is incorrect. If you are new, create an account first.');
			return;
		}

		sessionStorage.setItem(STUDENT_SESSION_KEY, email);
		openDashboard(account);
	} catch (error) {
		showMessage(error instanceof Error && error.message.includes('Secure password hashing')
			? error.message
			: 'We could not log you in right now. Please try again.');
	}
});

document.querySelector('#logoutButton').addEventListener('click', () => {
	sessionStorage.removeItem(STUDENT_SESSION_KEY);
	dashboard.hidden = true;
	authPanel.hidden = false;
	loginForm.reset();
	setMode('login');
	showMessage('You have been logged out.', 'success');
});

try {
	const signedInEmail = sessionStorage.getItem(STUDENT_SESSION_KEY);
	const signedInAccount = signedInEmail ? readAccounts()[signedInEmail] : null;
	if (signedInAccount) openDashboard(signedInAccount);
} catch {
	showMessage('Browser storage is unavailable. Please enable it to use the student portal.');
}
