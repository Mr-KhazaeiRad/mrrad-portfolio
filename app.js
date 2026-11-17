(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  $('.command-button').setAttribute('aria-label', '⌘ K — باز کردن منوی دسترسی سریع');
  $('.site-footer .brand').setAttribute('aria-label', 'dev — بازگشت به بالای صفحه');
  const profile = {
    name: 'نام شما',
    codeName: 'Your Name',
    email: 'hello@example.com',
    location: 'ایران · آماده همکاری ریموت',
    github: '',
    linkedin: '',
    isDemo: true,
    ...window.PORTFOLIO_PROFILE,
  };

  $$('[data-profile]').forEach(element => {
    const key = element.dataset.profile;
    if (profile[key]) element.textContent = key === 'codeName' ? `"${profile[key]}"` : profile[key];
  });
  $('#current-year').textContent = new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(new Date().getFullYear());
  if (!profile.isDemo) {
    $('.contact-placeholder-note').hidden = true;
    $('.form-demo-note').hidden = true;
    $('.footer-demo').textContent = 'طراحی و توسعه با اشتیاق';
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

  $$('[data-social]').forEach(button => {
    const network = button.dataset.social;
    const allowedHost = network === 'github' ? 'github.com' : 'linkedin.com';
    let destination;
    try {
      const candidate = new URL(profile[network]);
      if (candidate.protocol === 'https:' && (candidate.hostname === allowedHost || candidate.hostname === `www.${allowedHost}`)) destination = candidate.href;
    } catch { /* Unconfigured social links stay in demo mode. */ }
    button.addEventListener('click', () => {
      if (destination) {
        window.open(destination, '_blank', 'noopener,noreferrer');
      } else {
        notify(`لینک ${network === 'github' ? 'گیت‌هاب' : 'لینکدین'} شما هنوز وارد نشده؛ بعداً اضافه‌اش می‌کنیم.`);
      }
    });
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
  const roles = ['CREATIVE DEVELOPER', 'FRONT-END DEVELOPER', 'PROBLEM SOLVER', 'ALWAYS A LEARNER'];
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

  const projects = {
    nexus: {
      title: 'نکسوس — داشبورد مدیریت',
      description: 'یک کانسپت برای داشبورد تحلیلی که داده‌های پراکنده را به تصویری روشن از وضعیت کسب‌وکار تبدیل می‌کند. طراحی تیره، نمودارهای خوانا و ساختاری که کاربر را مستقیم به اطلاعات مهم می‌رساند.',
      tags: ['React', 'TypeScript', 'Chart.js', 'Responsive Design'],
      features: ['نمای یکپارچه درآمد و کاربران', 'زبان بصری آرام و متمرکز برای داده‌های پیچیده', 'طرح واکنش‌گرا و کامپوننت‌های قابل استفاده مجدد'],
    },
    orbit: {
      title: 'اوربیت — استودیو خلاق',
      description: 'یک کانسپت وب‌سایت برای استودیویی که دوست ندارد شبیه بقیه باشد. تایپوگرافی درشت، رنگ‌های جسورانه و جزئیات غیرمنتظره در خدمت یک هویت بصری متمایز.',
      tags: ['Next.js', 'CSS Motion', 'Figma', 'Creative Development'],
      features: ['لندینگ جسورانه و تایپوگرافی ادیتوریال', 'هویت بصری متفاوت برای یک استودیو طراحی', 'ایده‌پردازی تعامل‌ها و حرکت‌های ظریف در رابط'],
    },
    violet: {
      title: 'ویولت — فروشگاه آنلاین',
      description: 'یک کانسپت فروشگاه مینیمال که محصول را در مرکز توجه قرار می‌دهد. رنگ‌های ملایم، جزئیات دقیق و مسیری ساده برای آشنایی با محصول و انتخاب آن.',
      tags: ['Next.js', 'Node.js', 'Tailwind CSS', 'E-commerce UI'],
      features: ['ارائه مینیمال و متمرکز روی محصول', 'پالت رنگی ملایم و چیدمان خوانا', 'طراحی اولیه مسیر مشاهده و انتخاب محصول'],
    },
  };
  const projectDialog = $('#project-dialog');
  $$('[data-open-project]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.openProject;
    const project = projects[id];
    if (!project) return;
    $('#project-dialog-title').textContent = project.title;
    $('#project-dialog-description').textContent = project.description;
    const preview = $(`[data-project="${id}"] .project-preview`).cloneNode(true);
    preview.removeAttribute('data-open-project');
    preview.removeAttribute('aria-label');
    preview.setAttribute('tabindex', '-1');
    // The cloned illustration does not create duplicate SVG IDs.
    $$('[id]', preview).forEach(element => {
      const oldId = element.id;
      element.id = `dialog-${oldId}`;
      $$('[fill], [stroke]', preview).forEach(shape => {
        for (const attribute of ['fill', 'stroke']) {
          if (shape.getAttribute(attribute) === `url(#${oldId})`) {
            shape.setAttribute(attribute, `url(#dialog-${oldId})`);
          }
        }
      });
    });
    $('#project-dialog-preview').replaceChildren(preview);
    $('#project-dialog-tags').replaceChildren(...project.tags.map(tag => {
      const element = document.createElement('span');
      element.textContent = tag;
      return element;
    }));
    $('#project-dialog-features').replaceChildren(...project.features.map(feature => {
      const item = document.createElement('li');
      item.textContent = feature;
      return item;
    }));
    openDialog(projectDialog);
  }));
  $('#project-contact').addEventListener('click', () => projectDialog.close());

  // A small, real interactive terminal. No commands execute on the machine.
  const terminal = $('#terminal-output');
  const terminalInput = $('#terminal-input');
  const commandHistory = [];
  let historyPosition = 0;
  const commands = {
    help: () => 'Available commands:\n  about     A little introduction\n  skills    My digital toolbox\n  projects  Explore selected projects\n  contact   Let’s talk\n  whoami    Who is behind the code?\n  date      Today on planet Earth\n  clear     Clear this terminal',
    about: () => 'A curious developer who turns ideas into thoughtful digital experiences.\nAlways learning. Always building.',
    whoami: () => `${profile.codeName} — Creative Developer${profile.isDemo ? '\n[Demo profile — ready for your real story]' : ''}`,
    skills: () => 'Front-end → React, Next.js, TypeScript, CSS\nBack-end  → Node.js, Express, PostgreSQL\nTools     → Git, Figma, Docker, Coffee ☕',
    projects: () => { projectDialog.close(); $('#projects').scrollIntoView({ behavior: motionQuery.matches ? 'instant' : 'smooth' }); return 'Opening selected projects…\nNexus / Orbit / Violet — portfolio design concepts.'; },
    contact: () => { $('#contact').scrollIntoView({ behavior: motionQuery.matches ? 'instant' : 'smooth' }); return `${profile.email}${profile.isDemo ? ' [placeholder email]' : ''}\nGreat things start with a hello.`; },
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
    inputLine.textContent = `visitor@dev:~$ ${raw}`;
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
  $('#copy-email').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      notify(profile.isDemo ? 'ایمیل نمونه کپی شد؛ بعداً آدرس واقعی شما رو می‌ذاریم.' : 'آدرس ایمیل کپی شد. منتظر پیامت هستم!');
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents($('#copy-email [data-profile="email"]'));
      selection.removeAllRanges();
      selection.addRange(range);
      notify('ایمیل انتخاب شد؛ با Ctrl+C یا لمس طولانی کپی‌اش کن.');
    }
  });

  const contactDialog = $('#contact-dialog');
  $('#open-contact').addEventListener('click', () => openDialog(contactDialog));
  $('#contact-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const feedback = $('#contact-feedback');
    if (profile.isDemo || profile.email === 'hello@example.com') {
      feedback.textContent = 'فرم آماده است، اما ایمیل هنوز نمونه است. برای ارسال واقعی، ایمیل خودت را در public/profile.js وارد کن و isDemo را false بگذار.';
      return;
    }
    const data = new FormData(form);
    const subject = `گفتگو درباره یک پروژه — ${data.get('name')}`;
    const body = `سلام!\n\nنام: ${data.get('name')}\nایمیل: ${data.get('email')}\n\n${data.get('message')}`;
    window.location.href = `mailto:${encodeURIComponent(profile.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    feedback.textContent = 'پیش‌نویس برای برنامه ایمیل آماده شد. اگر برنامه‌ای باز نشد، آدرس ایمیل را از صفحه کپی کن.';
  });
})();
