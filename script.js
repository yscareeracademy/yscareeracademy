const loginTab = document.querySelector('#loginTab');
const signupTab = document.querySelector('#signupTab');
const loginForm = document.querySelector('#loginForm');
const signupForm = document.querySelector('#signupForm');
const accountMessage = document.querySelector('#accountMessage');
const academyAuthClient = window.yscaSupabase;
const queryParams = new URLSearchParams(window.location.search);
let pendingCourseDestination = window.yscaGetProtectedReturnPath(queryParams.get('returnTo'));
let pendingCourseName = '';

function requestAccountAccess(destination, courseName) {
	closeMobileMenu();
	pendingCourseDestination = window.yscaGetProtectedReturnPath(destination);
	pendingCourseName = courseName;
	setAccountMode('login');
	const destinationPage = pendingCourseDestination?.split(/[?#]/)[0];
	const isIntermediateCourse = destinationPage === 'intermediate-1st-year.html'
		|| destinationPage === 'intermediate-2nd-year.html';
	const displayedCourseName = isIntermediateCourse ? 'Intermediate classes and resources' : courseName;
	accountMessage.textContent = `Log in or create an account to continue to ${displayedCourseName}.`;
	const signupCourse = document.querySelector('#signupCourse');
	const courseByPage = {
		'intermediate-1st-year.html': 'Intermediate 1st Year',
		'intermediate-2nd-year.html': 'Intermediate 2nd Year',
		'lawcet.html': 'LAWCET Preparation',
		'llb.html': 'LLB',
		'materials.html': ''
	};
	const selectedCourse = courseByPage[pendingCourseDestination?.split(/[?#]/)[0]];
	if (selectedCourse) signupCourse.value = selectedCourse;
	document.querySelector('.account-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
	loginTab.focus({ preventScroll: true });
}

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

if (pendingCourseDestination) {
	const requestedPage = pendingCourseDestination.split(/[?#]/)[0];
	const requestedCourseNames = {
		'intermediate-1st-year.html': 'Intermediate 1st Year',
		'intermediate-2nd-year.html': 'Intermediate 2nd Year',
		'lawcet.html': 'LAWCET Preparation',
		'llb.html': 'LLB Course',
		'materials.html': 'Study Materials'
	};
	pendingCourseName = requestedCourseNames[requestedPage] || 'your selected course';
	accountMessage.textContent = `Log in or create an account to continue to ${pendingCourseName}.`;
	const selectedCourse = requestedCourseNames[requestedPage];
	if (selectedCourse && signupForm.elements.course) signupForm.elements.course.value = selectedCourse;
}

loginTab.addEventListener('click', () => setAccountMode('login'));
signupTab.addEventListener('click', () => setAccountMode('signup'));

[loginForm, signupForm].forEach((form) => {
	form.addEventListener('submit', async (event) => {
		event.preventDefault();

		if (!form.reportValidity()) return;

		if (form === signupForm && signupForm.elements.password.value !== signupForm.elements.confirmPassword.value) {
			accountMessage.textContent = 'The passwords do not match. Please check both fields.';
			signupForm.elements.confirmPassword.focus();
			return;
		}

		if (!academyAuthClient) {
			accountMessage.textContent = 'Account access is unavailable right now. Please refresh and try again.';
			return;
		}

		accountMessage.textContent = 'Please wait...';

		try {
			if (form === loginForm) {
				const { error } = await academyAuthClient.auth.signInWithPassword({
					email: loginForm.querySelector('[name="email"]').value.trim(),
					password: loginForm.querySelector('[name="password"]').value
				});
				if (error) throw error;
				openPendingCourse();
				return;
			}

			const returnUrl = new URL('index.html', window.location.href);
			if (pendingCourseDestination) {
				returnUrl.searchParams.set('returnTo', pendingCourseDestination);
			}

			const { data, error } = await academyAuthClient.auth.signUp({
				email: signupForm.querySelector('[name="email"]').value.trim(),
				password: signupForm.querySelector('[name="password"]').value,
				options: {
					emailRedirectTo: returnUrl.href,
					data: {
						full_name: signupForm.querySelector('[name="name"]').value.trim(),
						phone: signupForm.querySelector('[name="phone"]').value.trim(),
						course: signupForm.querySelector('[name="course"]').value
					}
				}
			});
			if (error) throw error;

			if (data.session) {
				openPendingCourse();
				return;
			}

			accountMessage.textContent = 'Check your email to confirm your account, then log in to continue.';
		} catch (error) {
			accountMessage.textContent = error instanceof Error
				? error.message
				: 'We could not complete account access. Please try again.';
		}
	});
});

function openPendingCourse() {
	if (pendingCourseDestination) {
		window.location.assign(pendingCourseDestination);
		return;
	}

	window.location.assign('index.html#courses');
}

async function restorePendingCourse() {
	const authError = queryParams.get('authError');
	if (authError) {
		accountMessage.textContent = authError === 'service-unavailable'
			? 'Account access is temporarily unavailable. Please check your connection and try again.'
			: 'We could not verify your session. Please log in again.';
	}

	if (!academyAuthClient) {
		if (!authError) accountMessage.textContent = 'Account access is unavailable right now. Please refresh and try again.';
		return;
	}

	try {
		const { data, error } = await academyAuthClient.auth.getSession();
		if (error) throw error;
		if (!data.session || !pendingCourseDestination) return;

		const { data: userData, error: userError } = await academyAuthClient.auth.getUser();
		if (userError) throw userError;
		if (userData.user) openPendingCourse();
	} catch {
		accountMessage.textContent = 'We could not check your account session. Please try logging in again.';
	}
}

void restorePendingCourse();

document.querySelectorAll('[data-requires-account="true"]').forEach((link) => {
	link.addEventListener('click', (event) => {
		event.preventDefault();
		requestAccountAccess(link.href, link.textContent.trim());
	});
});

document.querySelectorAll('[data-account-mode]').forEach((link) => {
	link.addEventListener('click', (event) => {
		event.preventDefault();
		setAccountMode(link.dataset.accountMode);
		document.querySelector('.account-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
		document.querySelector(`#${link.dataset.accountMode}Tab`).focus({ preventScroll: true });
		closeMobileMenu();
	});
});

document.querySelectorAll('[data-course-choice]').forEach((button) => {
	button.addEventListener('click', () => {
		const select = document.getElementById(button.dataset.courseChoice);
		if (!(select instanceof HTMLSelectElement) || !select.value) {
			accountMessage.textContent = 'Choose a course option first.';
			select?.focus();
			return;
		}

		requestAccountAccess(select.value, select.selectedOptions[0].textContent.trim());
	});
});

const dropdowns = document.querySelectorAll('.nav-dropdown');
const navMenu = document.querySelector('#navMenu');
const menuButton = document.querySelector('#menuButton');

function closeMobileMenu() {
	navMenu.classList.remove('active');
	menuButton.setAttribute('aria-expanded', 'false');
	menuButton.setAttribute('aria-label', 'Open Menu');
	menuButton.textContent = '☰';
	dropdowns.forEach((dropdown) => {
		dropdown.classList.remove('open');
		dropdown.querySelector('.nav-dropdown-toggle, .nav-account-button').setAttribute('aria-expanded', 'false');
	});
}

menuButton.addEventListener('click', () => {
	const isOpen = navMenu.classList.toggle('active');
	menuButton.setAttribute('aria-expanded', String(isOpen));
	menuButton.setAttribute('aria-label', isOpen ? 'Close Menu' : 'Open Menu');
	menuButton.textContent = isOpen ? '×' : '☰';
});

dropdowns.forEach((dropdown) => {
	const toggle = dropdown.querySelector('.nav-dropdown-toggle');
	const accountToggle = dropdown.querySelector('.nav-account-button');
	const trigger = toggle || accountToggle;

	trigger.addEventListener('click', () => {
		const isOpen = dropdown.classList.toggle('open');

		dropdowns.forEach((otherDropdown) => {
			if (otherDropdown !== dropdown) {
				otherDropdown.classList.remove('open');
				const otherTrigger = otherDropdown.querySelector('.nav-dropdown-toggle, .nav-account-button');
				otherTrigger.setAttribute('aria-expanded', 'false');
			}
		});

		trigger.setAttribute('aria-expanded', String(isOpen));
	});
});

document.addEventListener('click', (event) => {
	dropdowns.forEach((dropdown) => {
		if (!dropdown.contains(event.target)) {
			dropdown.classList.remove('open');
			dropdown.querySelector('.nav-dropdown-toggle, .nav-account-button').setAttribute('aria-expanded', 'false');
		}
	});

	if (window.innerWidth <= 720 && !navMenu.contains(event.target) && !menuButton.contains(event.target)) {
		closeMobileMenu();
	}
});

navMenu.querySelectorAll('a:not([data-account-mode])').forEach((link) => {
	link.addEventListener('click', closeMobileMenu);
});
