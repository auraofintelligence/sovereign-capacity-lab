// Keep the page and calculator close to the top on small screens.
const narrow = window.matchMedia('(max-width: 720px)');
const menu = document.querySelector('.rail details');
function sizeMenu() { if (menu) menu.open = !narrow.matches; }
sizeMenu();
narrow.addEventListener('change', sizeMenu);
