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
