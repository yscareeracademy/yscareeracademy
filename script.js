const loginTab = document.querySelector('#loginTab');
const signupTab = document.querySelector('#signupTab');
const loginForm = document.querySelector('#loginForm');
const signupForm = document.querySelector('#signupForm');
const accountMessage = document.querySelector('#accountMessage');

function setAccountMode(mode) {
	const isLogin = mode === 'login';

	loginForm.hidden = !isLogin;
	signupForm.hidden = isLogin;
	loginTab.classList.toggle('is-active', isLogin);
	signupTab.classList.toggle('is-active', !isLogin);
	loginTab.setAttribute('aria-selected', String(isLogin));
	signupTab.setAttribute('aria-selected', String(!isLogin));
	document.querySelector('#accountTitle').textContent = isLogin ? 'Welcome back' : 'Create your account';
	document.querySelector('#accountDescription').textContent = isLogin
		? 'Sign in to continue your learning journey.'
		: 'Join YS Career Academy and start learning.';
	accountMessage.textContent = '';
}

loginTab.addEventListener('click', () => setAccountMode('login'));
signupTab.addEventListener('click', () => setAccountMode('signup'));

[loginForm, signupForm].forEach((form) => {
	form.addEventListener('submit', (event) => {
		event.preventDefault();

		if (form === signupForm && signupForm.elements.password.value !== signupForm.elements.confirmPassword.value) {
			accountMessage.textContent = 'The passwords do not match. Please check both fields.';
			signupForm.elements.confirmPassword.focus();
			return;
		}

		accountMessage.textContent = 'Signup and login are not connected yet. Your information was not sent.';
	});
});

const dropdowns = document.querySelectorAll('.nav-dropdown');

dropdowns.forEach((dropdown) => {
	const toggle = dropdown.querySelector('.nav-dropdown-toggle');

	toggle.addEventListener('click', () => {
		const isOpen = dropdown.classList.toggle('open');

		dropdowns.forEach((otherDropdown) => {
			if (otherDropdown !== dropdown) {
				otherDropdown.classList.remove('open');
				otherDropdown.querySelector('.nav-dropdown-toggle').setAttribute('aria-expanded', 'false');
			}
		});

		toggle.setAttribute('aria-expanded', String(isOpen));
	});
});

document.addEventListener('click', (event) => {
	dropdowns.forEach((dropdown) => {
		if (!dropdown.contains(event.target)) {
			dropdown.classList.remove('open');
			dropdown.querySelector('.nav-dropdown-toggle').setAttribute('aria-expanded', 'false');
		}
	});
});
