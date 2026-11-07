// Progressive navigation enhancements. Static links also work without JavaScript.
const narrow = window.matchMedia('(max-width: 720px)');
const menu = document.querySelector('.rail .primary-nav');
function sizeMenu() { if (menu) menu.open = !narrow.matches; }
sizeMenu();
narrow.addEventListener('change', sizeMenu);

const allPages = document.querySelector('.all-pages');
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && allPages?.open) {
    allPages.open = false;
    allPages.querySelector('summary').focus();
  }
});
document.addEventListener('click', event => {
  if (allPages?.open && !allPages.contains(event.target)) allPages.open = false;
});

function arrangeReading() {
  document.querySelectorAll('[data-after-section]').forEach(figure => {
    const section = document.getElementById(figure.dataset.afterSection);
    if (section && section.nextElementSibling !== figure) section.after(figure);
  });
  const sectionNav = document.querySelector('.section-nav');
  const nav = sectionNav?.querySelector('nav');
  if (!nav) return;
  const headings = [...document.querySelectorAll('main h2')].filter(h => !h.closest('.visual-credit-entry'));
  const fragment = document.createDocumentFragment();
  headings.forEach((heading, index) => {
    if (!heading.id) {
      const section = heading.closest('section[id]');
      if (section) heading.dataset.anchor = section.id;
      else heading.id = 'on-page-' + (index + 1);
    }
    const a = document.createElement('a');
    a.href = '#' + (heading.id || heading.dataset.anchor);
    a.textContent = heading.textContent;
    fragment.append(a);
  });
  nav.replaceChildren(fragment);
  sectionNav.hidden = !headings.length;
}
arrangeReading();
const calculator = document.getElementById('calculator');
if (calculator) {
  const observer = new MutationObserver(() => arrangeReading());
  observer.observe(calculator, {childList: true});
}
const backTop = document.querySelector('.back-top');
let ticking = false;
function scrollState() {
  const available = document.documentElement.scrollHeight - innerHeight;
  document.documentElement.style.setProperty('--read-progress', (available > 0 ? Math.min(100,scrollY / available * 100) : 0) + '%');
  backTop?.classList.toggle('is-floating', scrollY > 700);
  ticking = false;
}
addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(scrollState); ticking = true; }
}, {passive: true});
addEventListener('resize', scrollState);
scrollState();
