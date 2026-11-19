(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  const profile = window.PORTFOLIO_PROFILE || {};
  const email = typeof profile.email === 'string' ? profile.email.trim() : '';
  const emailEnabled = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const openContact = $('#open-contact');
  const copyEmail = $('#copy-email');

  $$('[data-profile]').forEach(element => {
    const key = element.dataset.profile;
    if (profile[key]) element.textContent = key === 'codeName' ? JSON.stringify(profile[key]) : profile[key];
  });
  $('#current-year').textContent = new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(new Date().getFullYear());
  if (emailEnabled) {
    openContact.hidden = false;
    copyEmail.hidden = false;
    $('[data-profile="email"]', copyEmail).textContent = email;
    copyEmail.setAttribute('aria-label', `${email} — کپی آدرس ایمیل`);
  }

  // A quiet notification, used instead of non-working placeholder links.
  let toastTimer;
  function notify(message) {
    const toast = $('#toast');
    $('span', toast).textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 4300);
  }

  $$('[data-social]').forEach(link => {
    const network = link.dataset.social;
    const allowedHost = network === 'github' ? 'github.com' : 'linkedin.com';
    let destination;
    try {
      const candidate = new URL(profile[network]);
      if (candidate.protocol === 'https:' && (candidate.hostname === allowedHost || candidate.hostname === `www.${allowedHost}`)) destination = candidate.href;
    } catch { /* Leave the static GitHub fallback; hide unconfigured networks. */ }
    if (destination) {
      link.href = destination;
      link.hidden = false;
      if (network === 'github') {
        const repos = new URL(destination);
        repos.searchParams.set('tab', 'repositories');
        $('[data-github-repos]').href = repos.href;
      }
    }
  });

  // Mobile navigation.
  const menuToggle = $('.menu-toggle');
  const mobileMenu = $('#mobile-menu');
  function closeMenu() {
    mobileMenu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'باز کردن منو');
  }
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    mobileMenu.hidden = !open;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
  });
  $$('.mobile-nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => {
    if (!mobileMenu.hidden && !event.target.closest('.site-header')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileMenu.hidden) {
      closeMenu();
      menuToggle.focus();
    }
  });
  window.matchMedia('(min-width: 701px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });

  // Reveal content without hiding anything when JavaScript is unavailable.
  if ('IntersectionObserver' in window && !motionQuery.matches) {
    document.body.classList.add('motion-ready');
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -18px 0px' });
    $$('.reveal').forEach(element => revealObserver.observe(element));
  }

  // One passive scroll listener for the progress bar and active navigation.
  const navigationLinks = $$('.desktop-nav a');
  const sections = $$('main section[id]');
  const progress = $('.scroll-progress');
  let scrollScheduled = false;
  function updateScroll() {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${available > 0 ? Math.min(1, window.scrollY / available) : 0})`;
    let current = 'home';
    sections.forEach(section => {
      if (section.getBoundingClientRect().top <= 180) current = section.id;
    });
    navigationLinks.forEach(link => {
      const active = link.hash === `#${current}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scrollScheduled = false;
  }
  window.addEventListener('scroll', () => {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(updateScroll);
  }, { passive: true });
  window.addEventListener('resize', updateScroll, { passive: true });
  updateScroll();

  // A subtle typing label; paused in background tabs and for reduced motion.
  const roleLabel = $('#changing-role');
  const roles = ['C# DEVELOPER', 'GAME DEVELOPER', 'WEB DESIGNER'];
  let roleIndex = 0;
  let roleTimer;
  function typeNextRole() {
    if (document.hidden || motionQuery.matches) return;
    const next = roles[(roleIndex + 1) % roles.length];
    let deleting = true;
    let character = roleLabel.textContent.length;
    function tick() {
      if (document.hidden || motionQuery.matches) return;
      if (deleting) {
        character--;
        roleLabel.textContent = roleLabel.textContent.slice(0, Math.max(0, character));
        if (character <= 0) deleting = false;
      } else {
        character++;
        roleLabel.textContent = next.slice(0, character);
        if (character >= next.length) {
          roleIndex = (roleIndex + 1) % roles.length;
          roleTimer = setTimeout(typeNextRole, 3800);
          return;
        }
      }
      roleTimer = setTimeout(tick, deleting ? 32 : 65);
    }
    tick();
  }
  if (!motionQuery.matches) roleTimer = setTimeout(typeNextRole, 4500);
  document.addEventListener('visibilitychange', () => {
    clearTimeout(roleTimer);
    if (!document.hidden && !motionQuery.matches) {
      roleLabel.textContent = roles[roleIndex];
      roleTimer = setTimeout(typeNextRole, 3800);
    }
  });
  motionQuery.addEventListener('change', () => {
    clearTimeout(roleTimer);
    roleLabel.textContent = roles[roleIndex];
    if (!motionQuery.matches && !document.hidden) roleTimer = setTimeout(typeNextRole, 3800);
  });

  // Pointer effects are decorative only, and never run on touch devices.
  const hero = $('.hero');
  const art = $('.art-parallax');
  let pointerFrame;
  hero.addEventListener('pointermove', event => {
    if (!finePointer.matches || motionQuery.matches) return;
    cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => {
      const bounds = hero.getBoundingClientRect();
      art.style.setProperty('--art-x', `${((event.clientX - bounds.left) / bounds.width - 0.5) * 13}px`);
      art.style.setProperty('--art-y', `${((event.clientY - bounds.top) / bounds.height - 0.5) * 13}px`);
    });
  }, { passive: true });
  hero.addEventListener('pointerleave', () => {
    cancelAnimationFrame(pointerFrame);
    art.style.setProperty('--art-x', '0px');
    art.style.setProperty('--art-y', '0px');
  });
  $$('.magnetic').forEach(button => {
    button.addEventListener('pointermove', event => {
      if (!finePointer.matches || motionQuery.matches) return;
      const bounds = button.getBoundingClientRect();
      const x = (event.clientX - bounds.left - bounds.width / 2) * 0.08;
      const y = (event.clientY - bounds.top - bounds.height / 2) * 0.13;
      button.style.transform = `translate(${x}px,${y}px)`;
    }, { passive: true });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  });

  // Project filters work with both the pointer and keyboard.
  const filterButtons = $$('.filter-button');
  filterButtons.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    filterButtons.forEach(filter => {
      const active = filter === button;
      filter.classList.toggle('active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    $$('.project-card').forEach(card => {
      card.hidden = category !== 'all' && card.dataset.category !== category;
      if (!card.hidden) {
        card.classList.add('is-visible');
        if (!motionQuery.matches) card.animate([
          { opacity: 0, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 380, easing: 'ease-out' });
      }
    });
    updateScroll();
  }));

  // Native dialogs provide focus trapping, Escape support, and focus restoration.
  const dialogs = $$('dialog');
  function openDialog(dialog) {
    closeMenu();
    dialogs.forEach(other => { if (other.open) other.close(); });
    dialog.showModal();
    document.body.classList.add('dialog-open');
    dialog.scrollTop = 0;
  }
  dialogs.forEach(dialog => {
    $$('[data-close-dialog]', dialog).forEach(button => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('close', () => {
      if (!dialogs.some(item => item.open)) document.body.classList.remove('dialog-open');
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
  });
  const commandDialog = $('#command-dialog');
  $('.command-button').addEventListener('click', () => openDialog(commandDialog));
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (commandDialog.open) commandDialog.close();
      else openDialog(commandDialog);
    }
  });
  $$('.command-links a').forEach(link => link.addEventListener('click', () => commandDialog.close()));

  const projectDialog = $('#project-dialog');
  $$('[data-open-project]').forEach(button => button.addEventListener('click', () => {
    const card = button.closest('.project-card');
    const details = $('.project-details', card).content;
    $('#project-dialog-kind').textContent = $('.project-kind', card).textContent;
    $('#project-dialog-title').replaceChildren(...[...$('h3', card).childNodes].map(node => node.cloneNode(true)));
    $('#project-dialog-description').textContent = $('p', details).textContent;
    const image = $('img', button).cloneNode(true);
    image.loading = 'eager';
    $('#project-dialog-preview').dataset.project = card.dataset.project;
    $('#project-dialog-preview').replaceChildren(image);
    $('#project-dialog-tags').replaceChildren(...$$('.tags > span', card).map(node => node.cloneNode(true)));
    $('#project-dialog-features').replaceChildren(...$$('li', details).map(node => node.cloneNode(true)));
    $('#project-demo').href = $('.project-live', card).href;
    $('#project-repository').href = $('.project-source', card).href;
    openDialog(projectDialog);
  }));

  // A small, real interactive terminal. No commands execute on the machine.
  const terminal = $('#terminal-output');
  const terminalInput = $('#terminal-input');
  const commandHistory = [];
  let historyPosition = 0;
  const commands = {
    help: () => 'Available commands:\n  about     A little introduction\n  skills    My digital toolbox\n  projects  Explore selected projects\n  contact   Let’s talk\n  whoami    Who is behind the code?\n  date      Today on planet Earth\n  clear     Clear this terminal',
    about: () => 'Several years of programming, with a focus on C#, game development, and web design.',
    whoami: () => `${profile.codeName || 'Mohammad Khazaei Rad'} — C# / Games / Web`,
    skills: () => 'Games → C#, game logic\nWeb   → HTML, CSS, JavaScript, Tailwind CSS\nTools → Web APIs, localStorage, GitHub Pages',
    projects: () => { $('#projects').scrollIntoView({ behavior: motionQuery.matches ? 'instant' : 'smooth' }); return 'Opening selected projects…\nHava / Rooyesh / BlackHolesCoin'; },
    contact: () => { $('#contact').scrollIntoView({ behavior: motionQuery.matches ? 'instant' : 'smooth' }); return `GitHub: ${$('[data-social="github"]').href}${emailEnabled ? `\nEmail: ${email}` : ''}`; },
    date: () => new Intl.DateTimeFormat('en-GB', { dateStyle: 'full' }).format(new Date()),
    sudo: () => 'Nice try :) This terminal runs on curiosity, not root access.',
    coffee: () => '☕ Brewing ideas… Ready to build something great.',
    hello: () => 'Hey there! Glad you found this little corner of the internet.',
  };
  $('#terminal-form').addEventListener('submit', event => {
    event.preventDefault();
    const raw = terminalInput.value.trim();
    if (!raw) return;
    commandHistory.push(raw);
    if (commandHistory.length > 30) commandHistory.shift();
    historyPosition = commandHistory.length;
    terminalInput.value = '';
    if (raw.toLowerCase() === 'clear') {
      terminal.replaceChildren();
      return;
    }
    const inputLine = document.createElement('p');
    inputLine.textContent = `visitor@mrrad:~$ ${raw}`;
    const response = document.createElement('p');
    response.className = 'terminal-response';
    const name = raw.toLowerCase();
    const command = Object.hasOwn(commands, name) ? commands[name] : null;
    response.textContent = command ? command() : `Command not found: ${raw}\nType "help" for available commands.`;
    terminal.append(inputLine, response);
    while (terminal.childElementCount > 20) terminal.firstElementChild.remove();
    terminal.scrollTop = terminal.scrollHeight;
  });
  terminalInput.addEventListener('keydown', event => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    historyPosition = Math.min(commandHistory.length, Math.max(0, historyPosition + (event.key === 'ArrowUp' ? -1 : 1)));
    terminalInput.value = commandHistory[historyPosition] || '';
  });

  // Explicit copy action, with a useful fallback if clipboard access is blocked.
  copyEmail.addEventListener('click', async () => {
    if (!emailEnabled) return;
    try {
      await navigator.clipboard.writeText(email);
      notify('آدرس ایمیل کپی شد.');
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents($('[data-profile="email"]', copyEmail));
      selection.removeAllRanges();
      selection.addRange(range);
      notify('ایمیل انتخاب شد؛ با Ctrl+C یا لمس طولانی کپی‌اش کن.');
    }
  });

  const contactDialog = $('#contact-dialog');
  openContact.addEventListener('click', () => { if (emailEnabled) openDialog(contactDialog); });
  $('#contact-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const feedback = $('#contact-feedback');
    if (!emailEnabled) return;
    const data = new FormData(form);
    const subject = `گفتگو درباره یک پروژه — ${data.get('name')}`;
    const body = `سلام!\n\nنام: ${data.get('name')}\nایمیل: ${data.get('email')}\n\n${data.get('message')}`;
    const draft = document.createElement('a');
    draft.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    draft.hidden = true;
    form.append(draft);
    draft.click();
    draft.remove();
    feedback.textContent = 'پیش‌نویس برای برنامه ایمیل آماده شد. اگر برنامه‌ای باز نشد، آدرس ایمیل را از صفحه کپی کن.';
  });
})();
