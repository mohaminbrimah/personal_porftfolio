// =============================================================================
// script.js — Controls the hamburger menu, scroll animations, nav highlighting,
// contact form validation, and success/error messages after PHP redirect.
// =============================================================================

// ----- HAMBURGER MENU (mobile navigation) -----

const hamburger = document.getElementById('hamburger'); // The ☰ button (only visible on small screens)
const navbar = document.getElementById('navbar'); // The <nav> containing Home, About, Skills, etc.

if (hamburger && navbar) {
  // Click hamburger → toggle menu open/closed
  hamburger.addEventListener('click', function () {
    const isOpen = navbar.classList.toggle('is-open'); // Adds/removes .is-open (CSS slides menu down)
    hamburger.classList.toggle('is-active', isOpen); // Turns ☰ into ✕ via CSS rotation
    hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false'); // Accessibility for screen readers
    hamburger.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  });

  // Click any nav link → close mobile menu (so user sees the section they scrolled to)
  navbar.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navbar.classList.remove('is-open');
      hamburger.classList.remove('is-active');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Open navigation menu');
    });
  });

  // Resize to desktop width → force-close mobile menu
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
      navbar.classList.remove('is-open');
      hamburger.classList.remove('is-active');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
}

// ----- SCROLL SPY: highlight nav link for the section currently on screen -----

const sections = document.querySelectorAll('section[id]'); // Every section with an id (home, about, skills…)
const navLinks = document.querySelectorAll('.navbar a'); // All nav anchor links

function setActiveNavLink() {
  let currentId = 'home'; // Default active section
  const scrollPos = window.scrollY + 120; // Offset accounts for fixed header height

  sections.forEach(function (section) {
    if (scrollPos >= section.offsetTop) {
      currentId = section.id; // Last section passed becomes "current"
    }
  });

  navLinks.forEach(function (link) {
    const href = link.getAttribute('href'); // e.g. "#about"
    link.classList.toggle('active', href === '#' + currentId); // CSS styles .active with underline
  });
}

window.addEventListener('scroll', setActiveNavLink); // Update on scroll
setActiveNavLink(); // Run once on page load

// ----- SCROLL ANIMATION: fade elements in when they enter the viewport -----

const observerSupported = typeof IntersectionObserver !== 'undefined'; // Safe check for old browsers
const scrollObserver = observerSupported
  ? new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1'; // Fade to visible
            entry.target.style.transform = 'translateY(0)'; // Slide up into place
          }
        });
      },
      { threshold: 0.1 } // Trigger when 10% of element is visible
    )
  : null;

// All elements with class "animate-on-scroll" start hidden and animate when scrolled into view
document.querySelectorAll('.animate-on-scroll').forEach(function (el) {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  if (scrollObserver) scrollObserver.observe(el);
});

// ----- CONTACT FORM: client-side validation before POST to contact.php -----

const form = document.getElementById('contact-form'); // The contact form
const formStatus = document.getElementById('form-status'); // Box for success/error messages
const submitBtn = document.getElementById('submit-btn'); // Submit button

// CHANGE: paste your Formspree URL here as backup when PHP is not available (sign up free at formspree.io)
const FORMSPREE_FALLBACK = ''; // e.g. 'https://formspree.io/f/yourformid'

/** Show a colored status message above the form */
function showFormStatus(message, type) {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.className = 'form-status form-status--' + type; // type = success | error
  formStatus.hidden = false;
}

/** Read ?status= from URL after PHP redirect (contact.php sends user back here) */
function checkUrlStatus() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('status');
  if (status === 'success') {
    showFormStatus('Message sent! Thank you — I will get back to you soon.', 'success');
  } else if (status === 'error') {
    showFormStatus('Something went wrong. Please check your details and try again.', 'error');
  }
  if (status) {
    history.replaceState(null, '', window.location.pathname + window.location.hash); // Clean URL
  }
}

checkUrlStatus(); // Run on page load

if (form) {
  form.addEventListener('submit', async function (e) {
    e.preventDefault(); // Stop default submit until we validate (JS may submit via fetch instead)

    const name = form.querySelector('#name');
    const email = form.querySelector('#email');
    const message = form.querySelector('#message');
    let valid = true;

    // Validate required fields; red border = empty
    [name, email, message].forEach(function (input) {
      if (!input || input.value.trim() === '') {
        if (input) input.style.border = '2px solid red';
        valid = false;
      } else {
        input.style.border = '';
      }
    });

    if (!valid) {
      showFormStatus('Please fill in all required fields.', 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }

    // Try Formspree fallback if configured (works without PHP server)
    if (FORMSPREE_FALLBACK) {
      try {
        const response = await fetch(FORMSPREE_FALLBACK, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        if (response.ok) {
          form.reset();
          showFormStatus('Message sent! Thank you — I will get back to you soon.', 'success');
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send Message'; }
          return;
        }
      } catch (err) {
        // Fall through to normal PHP submit
      }
    }

    // Normal path: browser POSTs form data to contact.php (needs PHP hosting)
    form.submit();
  });
}

// ----- PROJECTS: "View More" toggles hidden project cards (.project-card--extra) -----

const projectsGrid = document.getElementById('projects-grid'); // Container holding all project cards
const viewMoreBtn = document.getElementById('projects-view-more'); // "View More Projects" button
const extraProjects = document.querySelectorAll('.project-card--extra'); // Cards hidden until expanded

if (viewMoreBtn && projectsGrid) {
  // If no extra projects, hide the View More button (GitHub link still shows)
  if (extraProjects.length === 0) {
    viewMoreBtn.style.display = 'none';
  }

  viewMoreBtn.addEventListener('click', function () {
    const isExpanded = projectsGrid.classList.toggle('is-expanded'); // CSS shows .project-card--extra
    viewMoreBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    viewMoreBtn.textContent = isExpanded ? 'Show Less' : 'View More Projects'; // Toggle label
  });
}
