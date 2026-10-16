(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const element = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  };
  const assetURL = path => /^https?:\/\//.test(path) ? path : path.split('/').map(encodeURIComponent).join('/');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let motionPaused = false;
  const entranceAnimations = new Map();
  const revealDelays = new WeakMap();
  const animateEntrance = (target, delay = 0, distance = 22) => {
    entranceAnimations.get(target)?.cancel();
    if (motionPaused || reducedMotion.matches || !target.animate || target.contains(document.activeElement)) return;
    const animation = target.animate([
      { opacity: 0, transform: `translateY(${distance}px)`, filter: 'blur(2px)' },
      { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }
    ], { duration: 620, delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
    entranceAnimations.set(target, animation);
    const clear = () => {
      if (entranceAnimations.get(target) === animation) entranceAnimations.delete(target);
    };
    animation.finished.then(clear, clear);
  };
  // Content stays visible if JavaScript, IntersectionObserver, or motion is unavailable.
  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('has-entered');
      animateEntrance(entry.target, revealDelays.get(entry.target) || 0);
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .08, rootMargin: '0px 0px -24px 0px' }) : null;
  const observeReveal = (target, delay = 0) => {
    revealDelays.set(target, delay);
    revealObserver?.observe(target);
  };
  document.addEventListener('focusin', event => {
    entranceAnimations.forEach((animation, target) => {
      if (target.contains(event.target)) animation.cancel();
    });
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) entranceAnimations.forEach(animation => animation.cancel());
  });
  const progress = element('div', 'scroll-progress');
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  $('#year').textContent = new Date().getFullYear();
  const header = $('.site-header');
  const toTop = $('.to-top');
  const updateScroll = () => {
    header.classList.toggle('scrolled', scrollY > 10);
    toTop.classList.toggle('show', scrollY > 600);
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${scrollable > 0 ? Math.min(1, Math.max(0, scrollY / scrollable)) : 0})`;
  };
  addEventListener('scroll', updateScroll, { passive: true });
  addEventListener('resize', updateScroll, { passive: true });
  updateScroll();

  const menuButton = $('.menu-btn');
  const nav = $('#nav');
  const setMenu = open => {
    nav.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menuButton.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('#nav a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) setMenu(false);
  });
  addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      setMenu(false);
      menuButton.focus();
    }
  });
  matchMedia('(min-width: 851px)').addEventListener('change', () => setMenu(false));
  const links = $$('#nav a:not(.btn)');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => {
          const active = link.hash === '#' + entry.target.id;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -65% 0px' });
    $$('main > section').forEach(section => observer.observe(section));
  }

  const grid = $('#works');
  const filters = $('.filters');
  const modal = $('#modal');
  const media = $('.m-media', modal);
  const original = $('.m-source', modal);
  const categories = ['All work', ...new Set(PORTFOLIO.map(project => project.category))];
  let selectedProject = null;
  let slide = 0;
  let opener = null;
  let activeCategory = 'All work';
  let expanded = false;
  let visibleProjects = [];
  const showMore = $('#show-more');
  const loadImage = (path, alt, lazy = false) => {
    const img = element('img');
    img.src = assetURL(path);
    img.alt = alt;
    img.decoding = 'async';
    if (lazy) img.loading = 'lazy';
    return img;
  };

  categories.forEach((category, index) => {
    const count = category === 'All work' ? PORTFOLIO.length : PORTFOLIO.filter(p => p.category === category).length;
    const button = element('button', '', category);
    button.type = 'button';
    button.dataset.category = category;
    button.setAttribute('aria-label', `${category}, ${count} projects`);
    button.setAttribute('aria-pressed', String(index === 0));
    button.append(element('span', 'filter-count', String(count)));
    filters.append(button);
  });
  PORTFOLIO.forEach((project, index) => {
    const button = element('button', 'work');
    button.type = 'button';
    button.dataset.index = String(index);
    button.dataset.category = project.category;
    button.dataset.type = project.type;
    button.setAttribute('aria-label', `View project: ${project.title}`);
    const thumb = element('span', 'thumb');
    thumb.append(loadImage(project.image, project.alt, true));
    thumb.append(element('span', 'media-badge', project.format));
    const peek = element('span', 'project-peek', 'View project ↗');
    peek.setAttribute('aria-hidden', 'true');
    thumb.append(peek);
    if (project.type === 'video') {
      const play = element('span', 'play-icon', '▶');
      play.setAttribute('aria-hidden', 'true');
      thumb.append(play);
    }
    const info = element('span', 'work-info');
    info.append(element('span', 'cat', project.category));
    const title = element('span', 'work-title', project.title);
    const arrow = element('span', '', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    title.append(arrow);
    info.append(title);
    button.append(thumb, info);
    grid.append(button);
  });
  const renderFilter = () => {
    const matching = PORTFOLIO.filter(project => activeCategory === 'All work' || project.category === activeCategory);
    visibleProjects = expanded ? matching : matching.slice(0, 6);
    $$('button', filters).forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === activeCategory)));
    $$('.work', grid).forEach(work => {
      const wasHidden = work.hidden;
      work.hidden = !visibleProjects.includes(PORTFOLIO[Number(work.dataset.index)]);
      if (work.hidden) {
        revealObserver?.unobserve(work);
        entranceAnimations.get(work)?.cancel();
      } else if (wasHidden || !work.classList.contains('has-entered')) {
        observeReveal(work, (visibleProjects.indexOf(PORTFOLIO[Number(work.dataset.index)]) % 3) * 75);
      }
    });
    const remaining = matching.length - visibleProjects.length;
    showMore.hidden = remaining === 0;
    showMore.textContent = `View all ${matching.length} projects ↓`;
    $('#work-count').textContent = remaining ? `${visibleProjects.length} selected / ${matching.length} total` : `${matching.length} projects`;
    updateScroll();
  };
  const selectCategory = category => {
    activeCategory = category;
    expanded = false;
    renderFilter();
  };
  renderFilter();
  filters.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    selectCategory(button.dataset.category);
  });
  showMore.addEventListener('click', () => {
    const firstNew = PORTFOLIO.indexOf(PORTFOLIO.filter(project => activeCategory === 'All work' || project.category === activeCategory)[visibleProjects.length]);
    expanded = true;
    renderFilter();
    $(`.work[data-index="${firstNew}"]`, grid)?.focus();
  });
  $$('[data-work-filter]').forEach(link => link.addEventListener('click', () => {
    selectCategory(link.dataset.workFilter);
    $$('button', filters).find(button => button.dataset.category === activeCategory)?.focus({ preventScroll: true });
  }));
  $$('[data-inquiry]').forEach(link => link.addEventListener('click', () => {
    prepareInquiry(`Inquiry: ${link.dataset.inquiry}`);
    setTimeout(() => $('#f-name').focus({ preventScroll: true }), 0);
  }));

  function prepareInquiry(subject) {
    $('#f-subject').value = subject;
    $('#f-subject').dispatchEvent(new Event('input', { bubbles: true }));
  }
  const releaseMedia = () => {
    const video = $('video', media);
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    media.replaceChildren();
  };
  const previousProject = $('.previous-project', modal);
  const nextProject = $('.next-project', modal);
  const moveProject = direction => {
    const index = visibleProjects.indexOf(selectedProject) + direction;
    if (index < 0 || index >= visibleProjects.length) return;
    openProject(visibleProjects[index], opener);
    // Keep sequential browsing on the control used, unless it reached an endpoint.
    const control = direction < 0 ? previousProject : nextProject;
    (control.disabled ? (direction < 0 ? nextProject : previousProject) : control).focus({ preventScroll: true });
  };
  previousProject.addEventListener('click', () => moveProject(-1));
  nextProject.addEventListener('click', () => moveProject(1));

  const updateGallery = () => {
    const image = $('img', media);
    image.src = assetURL(selectedProject.images[slide]);
    image.alt = `${selectedProject.title}, slide ${slide + 1} of ${selectedProject.images.length}`;
    $('.slide-count', media).textContent = `${slide + 1} / ${selectedProject.images.length}`;
    $('.previous-slide', media).disabled = slide === 0;
    $('.next-slide', media).disabled = slide === selectedProject.images.length - 1;
    original.href = image.src;
  };
  const moveSlide = direction => {
    slide = Math.max(0, Math.min(selectedProject.images.length - 1, slide + direction));
    updateGallery();
  };
  const openProject = (project, button) => {
    const alreadyOpen = modal.open;
    selectedProject = project;
    if (!alreadyOpen) opener = button;
    slide = 0;
    releaseMedia();
    const projectIndex = visibleProjects.indexOf(project);
    previousProject.disabled = projectIndex === 0;
    nextProject.disabled = projectIndex === visibleProjects.length - 1;
    $('.project-position', modal).textContent = `${projectIndex + 1} of ${visibleProjects.length}`;
    $('.m-cat', modal).textContent = project.format;
    $('#m-title').textContent = project.title;
    $('.m-desc', modal).textContent = project.description;
    original.href = assetURL(project.source || project.images[0]);
    original.textContent = project.type === 'pdf' ? 'Open full PDF ↗' : project.type === 'video' ? 'Open video file ↗' : 'Open full-size image ↗';
    if (project.type === 'video') {
      const video = element('video');
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.poster = assetURL(project.image);
      video.setAttribute('aria-label', project.title);
      video.addEventListener('error', () => {
        if (!$('.media-error', media)) media.append(element('p', 'media-error', 'This browser could not play the video. Use “Open video file” below to view or download it.'));
      });
      video.src = assetURL(project.source);
      media.append(video);
    } else {
      const img = loadImage(project.type === 'image' ? project.source : project.type === 'gallery' ? project.images[0] : project.image, project.alt);
      img.addEventListener('error', () => {
        if (!$('.media-error', media)) media.append(element('p', 'media-error', 'The preview could not load. You can open the original file below.'));
      });
      media.append(img);
      if (project.type === 'gallery') {
        const controls = element('div', 'gallery-nav');
        const previous = element('button', 'previous-slide', '←');
        const next = element('button', 'next-slide', '→');
        previous.type = next.type = 'button';
        previous.setAttribute('aria-label', 'Previous slide');
        next.setAttribute('aria-label', 'Next slide');
        const count = element('span', 'slide-count');
        count.setAttribute('aria-live', 'polite');
        previous.addEventListener('click', () => moveSlide(-1));
        next.addEventListener('click', () => moveSlide(1));
        controls.append(previous, count, next);
        media.append(controls);
        updateGallery();
      }
    }
    if (!alreadyOpen) {
      modal.showModal();
      document.body.classList.add('modal-open');
      $('.close', modal).focus();
    }
    modal.scrollTop = 0;
    animateEntrance(media, 0, 12);
    animateEntrance($('.m-body', modal), 80, 12);
  };
  grid.addEventListener('click', event => {
    const button = event.target.closest('.work');
    if (button) openProject(PORTFOLIO[Number(button.dataset.index)], button);
  });
  $('.close', modal).addEventListener('click', () => modal.close());
  modal.addEventListener('click', event => {
    if (event.target !== modal) return;
    const bounds = modal.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) modal.close();
  });
  modal.addEventListener('keydown', event => {
    if (selectedProject?.type !== 'gallery' || event.target.closest('.project-nav, video')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveSlide(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  modal.addEventListener('close', () => {
    releaseMedia();
    document.body.classList.remove('modal-open');
    selectedProject = null;
    opener?.focus({ preventScroll: true });
  });
  $('.m-actions a[href="#contact"]', modal).addEventListener('click', () => {
    prepareInquiry(`Project inquiry: ${selectedProject.title}`);
    modal.close();
    setTimeout(() => $('#f-name').focus({ preventScroll: true }), 0);
  });

  const form = $('#contact-form');
  const status = $('.status', form);
  const fields = $$('input,textarea', form);
  const rules = {
    name: value => value.trim() ? '' : 'Enter your name.',
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Enter a valid email address, like name@example.com.',
    subject: value => value.trim() ? '' : 'Enter a subject.',
    message: value => value.trim().length >= 10 ? '' : 'Enter a message of at least 10 characters.'
  };
  const check = input => {
    const message = rules[input.name](input.value);
    const field = input.closest('.field');
    field.classList.toggle('invalid', Boolean(message));
    input.setAttribute('aria-invalid', String(Boolean(message)));
    $('.err', field).textContent = message;
    return !message;
  };
  fields.forEach(input => {
    input.addEventListener('blur', () => check(input));
    input.addEventListener('input', () => {
      status.textContent = '';
      if (input.getAttribute('aria-invalid') === 'true') check(input);
    });
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!fields.map(check).every(Boolean)) {
      fields.find(input => input.getAttribute('aria-invalid') === 'true').focus();
      status.textContent = '';
      return;
    }
    const values = Object.fromEntries(new FormData(form));
    location.href = `mailto:chaaa.creatives@gmail.com?subject=${encodeURIComponent(values.subject.trim())}&body=${encodeURIComponent(values.message.trim() + '\n\n' + values.name.trim() + '\n' + values.email.trim())}`;
    status.textContent = 'Your email draft is ready in your email app. Review it there and press Send. If no app opened, email chaaa.creatives@gmail.com directly.';
  });

  const testimonialsGrid = $('#testimonials-grid');
  const certificatesGrid = $('#certificates-grid');
  const proofLink = (className, item, group, index) => {
    const link = element('a', className);
    link.href = assetURL(item.source || item.image);
    link.target = '_blank';
    link.rel = 'noopener';
    link.dataset.proofGroup = group;
    link.dataset.proofIndex = String(index);
    return link;
  };
  TESTIMONIALS.forEach((item, index) => {
    const card = element('article', 'testimonial-card');
    card.hidden = index >= 3;
    const category = element('p', 'testimonial-category', item.title);
    const quote = element('blockquote');
    quote.append(element('p', '', item.quote));
    const link = proofLink('testimonial-open', item, 'testimonials', index);
    link.setAttribute('aria-label', `Read original feedback: ${item.title}`);
    const thumb = loadImage(item.image, '', true);
    thumb.width = 64;
    thumb.height = 48;
    const caption = element('span');
    caption.append(element('span', 'testimonial-attribution', item.attribution), element('span', 'testimonial-read', 'Read original message ↗'));
    link.append(thumb, caption);
    card.append(category, quote, link);
    testimonialsGrid.append(card);
  });
  const moreTestimonials = $('#more-testimonials');
  moreTestimonials.hidden = TESTIMONIALS.length <= 3;
  moreTestimonials.addEventListener('click', () => {
    const cards = $$('.testimonial-card[hidden]', testimonialsGrid);
    cards.forEach((card, index) => {
      card.hidden = false;
      observeReveal(card, index * 75);
    });
    moreTestimonials.setAttribute('aria-expanded', 'true');
    moreTestimonials.hidden = true;
    cards[0]?.querySelector('a')?.focus({ preventScroll: true });
    cards[0]?.scrollIntoView({ behavior: motionPaused || reducedMotion.matches ? 'instant' : 'smooth', block: 'nearest' });
  });
  CERTIFICATES.forEach((item, index) => {
    const card = element('article', 'certificate-card');
    const link = proofLink('certificate-preview', item, 'certificates', index);
    link.setAttribute('aria-label', `View certificate: ${item.title}`);
    link.append(loadImage(item.image, item.alt, true), element('span', 'certificate-zoom', 'View certificate ↗'));
    const details = element('div', 'certificate-details');
    details.append(element('span', 'credential-badge', item.badge), element('h3', '', item.title));
    const meta = element('p', 'certificate-meta', `${item.issuer} · `);
    const date = element('time', '', item.dateLabel);
    date.dateTime = item.date;
    meta.append(date);
    details.append(meta, element('p', 'certificate-description', item.description));
    card.append(link, details);
    certificatesGrid.append(card);
  });
  const proofModal = $('#proof-modal');
  const proofStage = $('.proof-stage', proofModal);
  const proofPrevious = $('.proof-previous', proofModal);
  const proofNext = $('.proof-next', proofModal);
  let proofGroup = [], proofIndex = 0, proofOpener = null;
  const showProof = () => {
    const item = proofGroup[proofIndex];
    const certificate = proofGroup === CERTIFICATES;
    $('.proof-kind', proofModal).textContent = certificate ? 'Certificates' : 'Testimonials · original message';
    $('#proof-title').textContent = item.title;
    $('.proof-description', proofModal).textContent = certificate ? `${item.issuer} · ${item.dateLabel}. ${item.description}` : `“${item.quote}” — ${item.attribution}`;
    $('.proof-position', proofModal).textContent = `${proofIndex + 1} of ${proofGroup.length}`;
    proofPrevious.disabled = proofIndex === 0;
    proofNext.disabled = proofIndex === proofGroup.length - 1;
    const source = $('.proof-source', proofModal);
    source.href = assetURL(item.source || item.image);
    source.textContent = certificate && item.format === 'PDF' ? 'Open original PDF ↗' : 'Open original image ↗';
    const image = loadImage(item.image, item.alt);
    image.addEventListener('error', () => {
      if (image.isConnected) proofStage.append(element('p', 'media-error', 'The preview could not load. Use the original file link below.'));
    }, { once: true });
    proofStage.replaceChildren(image);
    proofModal.scrollTop = 0;
    animateEntrance(proofStage, 40, 12);
  };
  const openProof = event => {
    const link = event.target.closest('[data-proof-group]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !proofModal.showModal) return;
    event.preventDefault();
    proofGroup = link.dataset.proofGroup === 'certificates' ? CERTIFICATES : TESTIMONIALS;
    proofIndex = Number(link.dataset.proofIndex);
    proofOpener = link;
    proofModal.showModal();
    document.body.classList.add('modal-open');
    $('.proof-close', proofModal).focus();
    showProof();
  };
  testimonialsGrid.addEventListener('click', openProof);
  certificatesGrid.addEventListener('click', openProof);
  const moveProof = direction => {
    const next = proofIndex + direction;
    if (next < 0 || next >= proofGroup.length) return;
    proofIndex = next;
    showProof();
    const control = direction < 0 ? proofPrevious : proofNext;
    (control.disabled ? (direction < 0 ? proofNext : proofPrevious) : control).focus({ preventScroll: true });
  };
  proofPrevious.addEventListener('click', () => moveProof(-1));
  proofNext.addEventListener('click', () => moveProof(1));
  $('.proof-close', proofModal).addEventListener('click', () => proofModal.close());
  proofModal.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveProof(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  proofModal.addEventListener('click', event => {
    if (event.target !== proofModal) return;
    const bounds = proofModal.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) proofModal.close();
  });
  proofModal.addEventListener('close', () => {
    entranceAnimations.get(proofStage)?.cancel();
    proofStage.replaceChildren();
    document.body.classList.toggle('modal-open', Boolean($('dialog[open]')));
    proofOpener?.focus({ preventScroll: true });
  });

  const workflowTabs = $$('.workflow-tabs [role=tab]');
  const selectWorkflow = (tab, animate = true) => {
    workflowTabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(item.getAttribute('aria-controls'));
      panel.hidden = !selected;
      if (!selected) entranceAnimations.forEach((animation, target) => {
        if (panel.contains(target)) animation.cancel();
      });
    });
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    if (animate) {
      animateEntrance(panel, 0, 12);
      $$('.tool-grid li', panel).forEach((tile, index) => animateEntrance(tile, 60 + index * 45, 10));
    }
  };
  workflowTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      if (tab.getAttribute('aria-selected') !== 'true') selectWorkflow(tab);
    });
    tab.addEventListener('keydown', event => {
      const directions = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      let nextIndex;
      if (event.key in directions) nextIndex = (index + directions[event.key] + workflowTabs.length) % workflowTabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = workflowTabs.length - 1;
      else return;
      event.preventDefault();
      workflowTabs[nextIndex].focus({ preventScroll: true });
      selectWorkflow(workflowTabs[nextIndex]);
    });
  });
  selectWorkflow(workflowTabs[0], false);
  $('.toolkit').classList.add('is-interactive');
  const compactWorkflow = matchMedia('(max-width: 850px)');
  const updateWorkflowOrientation = () => $('.workflow-tabs').setAttribute('aria-orientation', compactWorkflow.matches ? 'horizontal' : 'vertical');
  compactWorkflow.addEventListener('change', updateWorkflowOrientation);
  updateWorkflowOrientation();

  const marqueeCopy = $('.marquee-set').cloneNode(true);
  marqueeCopy.setAttribute('aria-hidden', 'true');
  $('.marquee-track').append(marqueeCopy);
  $$('.floating-skill, .portrait-halo, .sound-bars i, .marquee-track').forEach(target => target.classList.add('motion-loop'));
  if ('IntersectionObserver' in window) {
    const loopObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      entry.target.classList.toggle('is-in-view', entry.isIntersecting);
    }));
    $$('.hero, .service-ribbon').forEach(target => loopObserver.observe(target));
  } else {
    $$('.hero, .service-ribbon').forEach(target => target.classList.add('is-in-view'));
  }
  document.body.classList.add('motion-ready');
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('page-inactive', document.hidden);
    if (document.hidden) hidePointer();
  });

  $$('.hero-copy > *').forEach((target, index) => observeReveal(target, Math.min(index * 65, 240)));
  observeReveal($('.hero-profile'), 150);
  $$('.section-heading, .portfolio-toolbar, .split > :not(.timeline):not(.strengths), .service-layout > *, .service-ribbon, .toolkit, .foot > *').forEach((target, index) => {
    observeReveal(target, (index % 2) * 90);
  });
  $$('.timeline > li, .strengths > li').forEach((target, index) => observeReveal(target, (index % 3) * 80));
  $$('.testimonial-card:not([hidden]), .certificate-card').forEach((target, index) => observeReveal(target, (index % 3) * 80));
  $$('.service').forEach(service => service.addEventListener('toggle', () => {
    if (service.open) animateEntrance($('.service-body', service), 50, 10);
    updateScroll();
  }));
  if ('ResizeObserver' in window) new ResizeObserver(updateScroll).observe(document.body);

  // A tiny companion dot, with no trail and no replacement of the native pointer.
  const cursor = element('div', 'cursor-follower');
  cursor.setAttribute('aria-hidden', 'true');
  document.body.append(cursor);
  let pointerFrame = 0;
  let pointerX = 0, pointerY = 0, cursorX = 0, cursorY = 0;
  let pointerVisible = false;
  let litSurface = null;
  const resetSurface = () => {
    if (!litSurface) return;
    ['--tilt-x', '--tilt-y', '--light-x', '--light-y'].forEach(property => litSurface.style.removeProperty(property));
    litSurface = null;
  };
  const hidePointer = () => {
    pointerVisible = false;
    cursor.classList.remove('is-visible', 'is-pressed');
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    resetSurface();
  };
  const paintPointer = () => {
    cursorX += (pointerX - cursorX) * .28;
    cursorY += (pointerY - cursorY) * .28;
    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
    if (litSurface) {
      const rect = litSurface.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (pointerX - 12 - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (pointerY - 12 - rect.top) / rect.height));
      litSurface.style.setProperty('--tilt-x', `${(0.5 - y) * 3}deg`);
      litSurface.style.setProperty('--tilt-y', `${(x - 0.5) * 3}deg`);
      litSurface.style.setProperty('--light-x', `${x * 100}%`);
      litSurface.style.setProperty('--light-y', `${y * 100}%`);
    }
    pointerFrame = Math.abs(pointerX - cursorX) + Math.abs(pointerY - cursorY) > .2 ? requestAnimationFrame(paintPointer) : 0;
  };
  document.addEventListener('pointermove', event => {
    if (motionPaused || !finePointer.matches || reducedMotion.matches || event.pointerType !== 'mouse') return;
    pointerX = Math.min(innerWidth - 16, event.clientX + 12);
    pointerY = Math.min(innerHeight - 16, event.clientY + 12);
    if (!pointerVisible) {
      cursorX = pointerX;
      cursorY = pointerY;
      pointerVisible = true;
      cursor.classList.add('is-visible');
    }
    cursor.classList.toggle('is-interactive', Boolean(event.target.closest('a, button, summary, input, textarea, video')));
    const nextSurface = event.target.closest('.hero-profile, .work')?.querySelector('.thumb') || event.target.closest('.hero-profile');
    if (nextSurface !== litSurface) {
      resetSurface();
      litSurface = nextSurface;
    }
    if (!pointerFrame) pointerFrame = requestAnimationFrame(paintPointer);
  }, { passive: true });
  document.addEventListener('pointerdown', () => cursor.classList.add('is-pressed'), { passive: true });
  document.addEventListener('pointerup', () => cursor.classList.remove('is-pressed'), { passive: true });
  document.documentElement.addEventListener('pointerleave', hidePointer);
  document.addEventListener('keydown', hidePointer);
  addEventListener('blur', hidePointer);
  finePointer.addEventListener('change', hidePointer);
  reducedMotion.addEventListener('change', hidePointer);
  // Keep the dot above the modal's backdrop without obscuring its controls.
  $$('dialog').forEach(dialog => dialog.addEventListener('toggle', () => {
    ($('dialog[open]') || document.body).append(cursor);
    hidePointer();
  }));
  const updateMotionControls = () => {
    const paused = motionPaused || reducedMotion.matches;
    document.body.classList.toggle('motion-paused', paused);
    $$('[data-motion-toggle]').forEach(button => {
      button.hidden = false;
      button.disabled = reducedMotion.matches;
      button.setAttribute('aria-pressed', String(paused));
      button.textContent = reducedMotion.matches ? 'Reduced motion on' : motionPaused ? '▷ Resume motion' : 'Ⅱ Pause motion';
    });
    if (paused) {
      entranceAnimations.forEach(animation => animation.cancel());
      hidePointer();
    }
  };
  $$('[data-motion-toggle]').forEach(button => button.addEventListener('click', () => {
    motionPaused = !motionPaused;
    updateMotionControls();
  }));
  reducedMotion.addEventListener('change', updateMotionControls);
  updateMotionControls();
})();
