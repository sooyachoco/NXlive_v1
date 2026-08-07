(function () {
  'use strict';

  const THEME_KEY = 'nxlive-theme';

  /* ===== Theme Toggle ===== */
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
  }

  function updateThemeIcon(theme) {
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    updateThemeIcon(next);
  }

  /* ===== Mobile Sidebar ===== */
  function initSidebar() {
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    function closeSidebar() {
      sidebar.classList.remove('sidebar--open');
      overlay.classList.remove('sidebar__overlay--visible');
      document.body.style.overflow = '';
    }

    function openSidebar() {
      sidebar.classList.add('sidebar--open');
      overlay.classList.add('sidebar__overlay--visible');
      document.body.style.overflow = 'hidden';
    }

    menuBtn?.addEventListener('click', () => {
      if (sidebar.classList.contains('sidebar--open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    overlay?.addEventListener('click', closeSidebar);

    sidebar?.querySelectorAll('.sidebar__nav-item, .sidebar__game-item').forEach((item) => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) closeSidebar();
      });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) closeSidebar();
    });
  }

  /* ===== Live Index Panel Toggle ===== */
  function getHeroStateFromPanel(panel) {
    return panel?.closest('.hero-block')?.querySelector('.hero-state')
      || document.getElementById('hero');
  }

  function getLiveIndexFromHero(heroState) {
    return heroState?.closest('.hero-block')?.querySelector('.live-index')
      || document.getElementById('liveIndex');
  }

  function updateLiveIndexActive(panel, activeItem) {
    panel.querySelectorAll('.live-index__item').forEach((item) => {
      item.classList.toggle('live-index__item--active', item === activeItem);
    });
  }

  function setHeroLiveMode(heroState) {
    const scheduled = heroState.querySelector('.hero-scheduled');
    heroState.classList.remove('hero-state--scheduled');
    heroState.classList.add('hero-state--live');
    scheduled?.setAttribute('hidden', '');
    heroRollApis.live?.restart();
  }

  function populateScheduledHero(scheduledEl, item) {
    const {
      scheduledBg,
      scheduledIcon,
      scheduledIconBg,
      scheduledGame,
      scheduledTitle,
      scheduledTime,
      scheduledCountdown,
      scheduledTags,
      scheduledTagReward,
    } = item.dataset;

    const bg = scheduledEl.querySelector('.hero-scheduled__bg');
    const gameIcon = scheduledEl.querySelector('#heroScheduledGameIcon');
    const gameName = scheduledEl.querySelector('#heroScheduledGameName');
    const title = scheduledEl.querySelector('#heroScheduledTitle');
    const time = scheduledEl.querySelector('#heroScheduledTime');
    const countdown = scheduledEl.querySelector('#heroScheduledCountdown');
    const tags = scheduledEl.querySelector('#heroScheduledTags');

    if (bg) {
      bg.src = scheduledBg;
      bg.alt = scheduledTitle;
    }
    if (gameIcon) {
      gameIcon.textContent = scheduledIcon;
      gameIcon.style.background = scheduledIconBg;
    }
    if (gameName) gameName.textContent = scheduledGame;
    if (title) title.textContent = scheduledTitle;
    if (time) time.textContent = scheduledTime;
    if (countdown) countdown.dataset.countdown = scheduledCountdown;

    if (tags) {
      tags.innerHTML = '';
      scheduledTags.split(',').map((tag) => tag.trim()).filter(Boolean).forEach((tag) => {
        const el = document.createElement('span');
        el.className = 'hero-scheduled__tag';
        if (tag === scheduledTagReward) el.classList.add('hero-scheduled__tag--reward');
        el.textContent = tag;
        tags.appendChild(el);
      });
    }
  }

  function setHeroScheduledMode(heroState, panel, item) {
    const scheduled = heroState.querySelector('.hero-scheduled');
    if (!scheduled) return;

    heroState.classList.remove('hero-state--live');
    heroState.classList.add('hero-state--scheduled');
    heroRollApis.live?.stop();
    populateScheduledHero(scheduled, item);
    scheduled.removeAttribute('hidden');
    updateLiveIndexActive(panel, item);
  }

  function initLiveIndex() {
    document.querySelectorAll('.live-index').forEach((panel) => {
      panel.querySelectorAll('.live-index__item[data-roll-index]').forEach((item) => {
        item.addEventListener('click', () => {
          const heroState = getHeroStateFromPanel(panel);
          if (heroState?.hidden) return;

          const rollIndex = Number(item.dataset.rollIndex);
          setHeroLiveMode(heroState);
          heroRollApis.live?.goTo(rollIndex);
          updateLiveIndexActive(panel, item);

          item.style.opacity = '0.6';
          setTimeout(() => { item.style.opacity = ''; }, 200);
          console.log('[A2S] live_index_click', { index: rollIndex });
        });
      });

      panel.querySelectorAll('.live-index__item[data-scheduled]').forEach((item) => {
        item.addEventListener('click', () => {
          const heroState = getHeroStateFromPanel(panel);
          if (heroState?.hidden) return;

          setHeroScheduledMode(heroState, panel, item);

          item.style.opacity = '0.6';
          setTimeout(() => { item.style.opacity = ''; }, 200);
          console.log('[A2S] live_index_scheduled_click', {
            game: item.dataset.scheduledGame,
            title: item.dataset.scheduledTitle,
          });
        });
      });
    });

    document.querySelectorAll('.hero-scheduled__notify-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const title = btn.closest('.hero__overlay')?.querySelector('.hero__title')?.textContent;
        console.log('[A2S] hero_notify_click', { title });
      });
    });
  }

  /* ===== Tooltips ===== */
  function initTooltips() {
    const triggers = document.querySelectorAll('[data-tooltip]');

    triggers.forEach((trigger) => {
      const text = trigger.getAttribute('data-tooltip');
      const placement = trigger.getAttribute('data-tooltip-placement') || 'right';
      const tooltip = document.createElement('div');
      tooltip.className = placement === 'bottom' ? 'tooltip tooltip--bottom' : 'tooltip';
      tooltip.innerHTML = `
        <svg class="tooltip__arrow icon" aria-hidden="true"><use href="#icon-tooltip-arrow"/></svg>
        <div class="tooltip__body">${text}</div>
      `;
      document.body.appendChild(tooltip);

      function positionTooltip() {
        const rect = trigger.getBoundingClientRect();
        tooltip.classList.add('tooltip--visible');
        tooltip.style.visibility = 'hidden';
        tooltip.style.left = '0';
        tooltip.style.top = '0';

        const tipRect = tooltip.getBoundingClientRect();
        const gap = 4;
        let left;
        let top;

        if (placement === 'bottom') {
          left = rect.left + (rect.width - tipRect.width) / 2;
          top = rect.bottom + gap;

          if (top + tipRect.height > window.innerHeight - 8) {
            top = rect.top - tipRect.height - gap;
          }
        } else {
          left = rect.right + gap;
          top = rect.top + (rect.height - tipRect.height) / 2;

          if (left + tipRect.width > window.innerWidth - 8) {
            left = rect.left - tipRect.width - gap;
          }
        }

        left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
        top = Math.max(8, Math.min(top, window.innerHeight - tipRect.height - 8));

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.style.visibility = 'visible';
      }

      function show() {
        positionTooltip();
      }

      function hide() {
        tooltip.classList.remove('tooltip--visible');
        tooltip.style.visibility = '';
      }

      trigger.addEventListener('mouseenter', show);
      trigger.addEventListener('focus', show);
      trigger.addEventListener('mouseleave', hide);
      trigger.addEventListener('blur', hide);
      window.addEventListener('scroll', hide, { passive: true });
      window.addEventListener('resize', hide);
    });
  }

  /* ===== VOD Filter Chips ===== */
  function initVodFilters() {
    const chips = document.querySelectorAll('.filter-chip');
    const cards = document.querySelectorAll('.vod-card');

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('filter-chip--active'));
        chip.classList.add('filter-chip--active');

        const filter = chip.dataset.filter;

        cards.forEach((card) => {
          const game = card.dataset.game;
          if (filter === 'all' || game === filter) {
            card.classList.remove('vod-card--hidden');
          } else {
            card.classList.add('vod-card--hidden');
          }
        });

        console.log('[A2S] vod_filter_click', { filter });
        document.dispatchEvent(new CustomEvent('vod-filter-changed'));
      });
    });
  }

  /* ===== VOD Pagination (더보기) ===== */
  function isVodCardFilteredOut(card) {
    return card.classList.contains('vod-card--hidden') || card.hidden === true;
  }

  function getGridColumnCount(grid) {
    const template = window.getComputedStyle(grid).gridTemplateColumns;
    if (!template || template === 'none') return 1;
    const repeatMatch = template.match(/repeat\((\d+)/);
    if (repeatMatch) return parseInt(repeatMatch[1], 10);
    return Math.max(1, template.split(' ').filter(Boolean).length);
  }

  function initVodPagination() {
    const controllers = [];

    document.querySelectorAll('.vod-grid[data-paginate]').forEach((grid) => {
      const rowCount = parseInt(grid.dataset.pageRows, 10) || 2;
      const wrap = grid.nextElementSibling;
      const btn = wrap?.hasAttribute('data-load-more-wrap') ? wrap.querySelector('[data-load-more]') : null;
      let visibleCount = 0;

      function getInitialCount() {
        return getGridColumnCount(grid) * rowCount;
      }

      function apply() {
        const cards = Array.from(grid.querySelectorAll('.vod-card'));
        let shown = 0;

        cards.forEach((card) => {
          if (isVodCardFilteredOut(card)) {
            card.classList.add('vod-card--paged-hidden');
            return;
          }
          if (shown < visibleCount) {
            card.classList.remove('vod-card--paged-hidden');
            shown += 1;
          } else {
            card.classList.add('vod-card--paged-hidden');
          }
        });

        const eligibleCount = cards.filter((card) => !isVodCardFilteredOut(card)).length;
        if (wrap) wrap.hidden = eligibleCount <= visibleCount;
      }

      function loadMore() {
        const cards = Array.from(grid.querySelectorAll('.vod-card'));
        const eligibleCount = cards.filter((card) => !isVodCardFilteredOut(card)).length;
        visibleCount = eligibleCount;
        apply();
      }

      function reset() {
        visibleCount = getInitialCount();
        apply();
      }

      btn?.addEventListener('click', loadMore);

      visibleCount = getInitialCount();
      apply();
      controllers.push({ reset, grid });

      window.addEventListener('resize', () => {
        const cards = Array.from(grid.querySelectorAll('.vod-card'));
        const eligibleCount = cards.filter((card) => !isVodCardFilteredOut(card)).length;
        const initial = getInitialCount();
        if (visibleCount <= initial) {
          visibleCount = initial;
          apply();
        } else if (visibleCount > eligibleCount) {
          visibleCount = eligibleCount;
          apply();
        }
      });
    });

    if (!controllers.length) return;

    document.addEventListener('vod-filter-changed', () => {
      controllers.forEach((controller) => controller.reset());
    });
  }

  /* ===== Countdown Timers ===== */
  function initCountdowns() {
    const countdowns = document.querySelectorAll('[data-countdown]');

    function update() {
      const now = Date.now();
      countdowns.forEach((el) => {
        const target = new Date(el.dataset.countdown).getTime();
        const diff = Math.max(0, target - now);

        if (diff <= 0) {
          el.textContent = '곧 시작';
          return;
        }

        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        el.textContent = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} 남음`;
      });
    }

    update();
    setInterval(update, 1000);
  }

  /* ===== Card Interactions ===== */
  function initCardClicks() {
    document.querySelectorAll('.live-card, .vod-card, .game-card').forEach((card) => {
      card.addEventListener('click', () => {
        const type = card.classList.contains('live-card') ? 'live'
          : card.classList.contains('vod-card') ? 'vod' : 'game';
        const title = card.querySelector('.live-card__title, .vod-card__title, .game-card__name')?.textContent;
        console.log('[A2S] card_click', { type, title });
      });
    });

    document.querySelectorAll('.hero__play-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        console.log('[A2S] hero_play_click');
      });
    });

    document.getElementById('loginBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      alert('넥슨ID 로그인 페이지로 이동합니다.');
    });
  }

  /* ===== Media Preview (hero + card thumbnails) ===== */
  const PREVIEW_VIDEO_SRC = 'assets/hero-preview.mp4';

  function bindMediaPreview(container, video, progressBar, activeClass) {
    let rafId = null;
    let isPreviewing = false;
    const progress = progressBar.parentElement;

    if (progress) {
      progress.hidden = true;
      progress.setAttribute('aria-hidden', 'true');
    }

    function setProgress(ratio) {
      progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
    }

    function tick() {
      if (!isPreviewing) {
        rafId = null;
        return;
      }

      if (video.duration && !video.paused) {
        setProgress(video.currentTime / video.duration);
      }
      rafId = requestAnimationFrame(tick);
    }

    function startPreview() {
      isPreviewing = true;
      container.classList.add(activeClass);
      if (progress) {
        progress.hidden = false;
        progress.setAttribute('aria-hidden', 'false');
      }

      if (rafId === null) {
        rafId = requestAnimationFrame(tick);
      }

      const playPromise = video.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {
          /* autoplay blocked until user interaction */
        });
      }
    }

    function stopPreview() {
      isPreviewing = false;
      container.classList.remove(activeClass);

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      video.pause();
      video.currentTime = 0;
      setProgress(0);
      if (progress) {
        progress.hidden = true;
        progress.setAttribute('aria-hidden', 'true');
      }
    }

    container.addEventListener('mouseenter', startPreview);
    container.addEventListener('mouseleave', stopPreview);
    container.addEventListener('focusin', startPreview);
    container.addEventListener('focusout', (event) => {
      if (!container.contains(event.relatedTarget)) stopPreview();
    });
  }

  function initHeroHover() {
    document.querySelectorAll('.hero-state--live .hero-roll__slide').forEach((slide) => {
      const video = slide.querySelector('.hero__video');
      const progress = slide.querySelector('.hero__progress');
      const progressBar = slide.querySelector('.hero__progress-bar');
      if (!video || !progress || !progressBar) return;

      bindMediaPreview(slide, video, progressBar, 'hero--previewing');

      slide.addEventListener('mouseenter', () => {
        progress.setAttribute('aria-hidden', 'false');
      });
      slide.addEventListener('mouseleave', () => {
        progress.setAttribute('aria-hidden', 'true');
      });
      slide.addEventListener('focusin', () => {
        progress.setAttribute('aria-hidden', 'false');
      });
      slide.addEventListener('focusout', (event) => {
        if (!slide.contains(event.relatedTarget)) progress.setAttribute('aria-hidden', 'true');
      });
    });

    document.querySelectorAll('.hero-state--empty').forEach((hero) => {
      const video = hero.querySelector('.hero__video');
      const progress = hero.querySelector('.hero__progress');
      const progressBar = hero.querySelector('.hero__progress-bar');
      if (!video || !progress || !progressBar) return;

      bindMediaPreview(hero, video, progressBar, 'hero--previewing');

      hero.addEventListener('mouseenter', () => {
        progress.setAttribute('aria-hidden', 'false');
      });
      hero.addEventListener('mouseleave', () => {
        progress.setAttribute('aria-hidden', 'true');
      });
      hero.addEventListener('focusin', () => {
        progress.setAttribute('aria-hidden', 'false');
      });
      hero.addEventListener('focusout', (event) => {
        if (!hero.contains(event.relatedTarget)) progress.setAttribute('aria-hidden', 'true');
      });
    });
  }

  const heroRollApis = {};

  function createHeroRoll(rollEl) {
    const slides = [...rollEl.querySelectorAll('.hero-roll__slide')];
    if (slides.length <= 1) return null;

    let current = 0;
    let timer = null;
    const INTERVAL = 7000;
    const heroState = rollEl.closest('.hero-state');

    function resetSlidePreview(slide) {
      slide.classList.remove('hero--previewing');
      const video = slide.querySelector('.hero__video');
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
      const progressBar = slide.querySelector('.hero__progress-bar');
      if (progressBar) progressBar.style.transform = 'scaleX(0)';
    }

    function goTo(index) {
      current = ((index % slides.length) + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === current;
        slide.classList.toggle('is-active', active);
        if (!active) resetSlidePreview(slide);
      });

      const liveIndex = getLiveIndexFromHero(heroState);
      liveIndex?.querySelectorAll('.live-index__item[data-roll-index]').forEach((item) => {
        const rollIndex = Number(item.dataset.rollIndex);
        item.classList.toggle('live-index__item--active', rollIndex === current);
      });
      liveIndex?.querySelectorAll('.live-index__item[data-scheduled]').forEach((item) => {
        item.classList.remove('live-index__item--active');
      });
    }

    function stop() {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function restart() {
      stop();
      if (heroState?.hidden) return;
      timer = window.setInterval(() => goTo(current + 1), INTERVAL);
    }

    rollEl.addEventListener('mouseenter', stop);
    rollEl.addEventListener('mouseleave', restart);
    rollEl.addEventListener('focusin', stop);
    rollEl.addEventListener('focusout', (event) => {
      if (!rollEl.contains(event.relatedTarget)) restart();
    });

    goTo(0);
    restart();

    return { stop, restart, goTo };
  }

  function initHeroRolls() {
    const liveRoll = document.querySelector('.hero-state--live .hero-roll');
    if (liveRoll) heroRollApis.live = createHeroRoll(liveRoll);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        heroRollApis.live?.stop();
        return;
      }
      heroRollApis.live?.restart();
    });
  }

  function getThumbPoster(wrap) {
    const img = wrap.querySelector(
      '.live-card__thumb, .vod-card__thumb, .live-card__portrait, .vod-card__portrait'
    );
    return img?.currentSrc || img?.src || '';
  }

  function initThumbPreviews() {
    document.querySelectorAll('.live-card__thumb-wrap, .vod-card__thumb-wrap').forEach((wrap) => {
      if (wrap.classList.contains('thumb-preview')) return;
      if (wrap.querySelector('.live-card__countdown')) return;

      wrap.classList.add('thumb-preview');

      const poster = getThumbPoster(wrap);

      const video = document.createElement('video');
      video.className = 'thumb-preview__video';
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'none';
      if (poster) video.poster = poster;
      video.innerHTML = `<source src="${PREVIEW_VIDEO_SRC}" type="video/mp4">`;

      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 'thumb-preview__play';
      playBtn.tabIndex = -1;
      playBtn.setAttribute('aria-hidden', 'true');
      playBtn.innerHTML = '<svg class="icon icon--play" aria-hidden="true"><use href="#icon-play"/></svg>';

      const progress = document.createElement('div');
      progress.className = 'thumb-preview__progress';
      progress.setAttribute('aria-hidden', 'true');
      progress.innerHTML = '<div class="thumb-preview__progress-bar"></div>';

      wrap.append(video, playBtn, progress);

      const progressBar = progress.querySelector('.thumb-preview__progress-bar');
      bindMediaPreview(wrap, video, progressBar, 'thumb-preview--active');

      wrap.addEventListener('mouseenter', () => {
        progress.setAttribute('aria-hidden', 'false');
      });
      wrap.addEventListener('mouseleave', () => {
        progress.setAttribute('aria-hidden', 'true');
      });
    });
  }

  function initChannelNotify() {
    document.getElementById('channelNotifyBtn')?.addEventListener('click', () => {
      console.log('[A2S] channel_notify_click');
    });
  }

  /* ===== 알림 신청 레이어 팝업 ===== */
  function initNotifySubscribe() {
    const overlay = document.getElementById('notifySubscribeOverlay');
    if (!overlay) return;

    const closeBtn = document.getElementById('notifySubscribeClose');
    const cancelBtn = document.getElementById('notifySubscribeCancel');
    const submitBtn = document.getElementById('notifySubscribeSubmit');
    const consent = document.getElementById('notifySubscribeConsent');
    const gameNameEls = overlay.querySelectorAll('[data-notify-game-name]');
    let lastFocused = null;

    function getGameName(btn) {
      if (btn.dataset.notifyGame) return btn.dataset.notifyGame;

      const scope = btn.closest('.hero-roll__slide, .hero-scheduled, .hero-state');
      const heroGame = scope?.querySelector('.hero__game-name')?.textContent?.trim();
      if (heroGame) return heroGame;

      return document.querySelector('.channel-header__title')?.textContent?.trim() || '';
    }

    function syncSubmit() {
      if (submitBtn) submitBtn.disabled = !consent?.checked;
    }

    function openModal(btn) {
      lastFocused = btn;
      const name = getGameName(btn);
      gameNameEls.forEach((el) => { el.textContent = name; });
      if (consent) consent.checked = false;
      syncSubmit();
      overlay.hidden = false;
      document.body.style.overflow = 'hidden';
      closeBtn?.focus();
      console.log('[A2S] notify_subscribe_open', { game: name });
    }

    function closeModal() {
      if (overlay.hidden) return;
      overlay.hidden = true;
      document.body.style.overflow = '';
      lastFocused?.focus();
      lastFocused = null;
    }

    document.querySelectorAll('.hero-scheduled__notify-btn, #channelNotifyBtn').forEach((btn) => {
      btn.addEventListener('click', () => openModal(btn));
    });

    consent?.addEventListener('change', syncSubmit);
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeModal();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !overlay.hidden) closeModal();
    });

    submitBtn?.addEventListener('click', () => {
      if (!consent?.checked) return;
      console.log('[A2S] notify_subscribe_submit', {
        game: gameNameEls[0]?.textContent?.trim(),
      });
      closeModal();
    });
  }

  /* ===== My Page Tabs ===== */
  function initMypageTabs() {
    const tabs = document.querySelectorAll('.mypage__tab');
    if (!tabs.length) return;

    const panels = document.querySelectorAll('.mypage__section[data-tab-panel]');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('mypage__tab--active'));
        tab.classList.add('mypage__tab--active');

        const target = tab.dataset.tabTarget;
        if (!target || !panels.length) return;
        panels.forEach((panel) => {
          panel.hidden = panel.dataset.tabPanel !== target;
        });

        if (target === 'watch') {
          requestAnimationFrame(() => {
            document.dispatchEvent(new CustomEvent('vod-filter-changed'));
          });
        }

        if (target !== 'winner') {
          document.dispatchEvent(new CustomEvent('prize-detail-close'));
        }
      });
    });
  }

  /* ===== My Page Prize Detail ===== */
  function copyTextToClipboard(text) {
    const value = text.trim();
    if (!value) return Promise.resolve(false);

    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(value)
        .then(() => true)
        .catch(() => copyTextToClipboardFallback(value));
    }

    return Promise.resolve(copyTextToClipboardFallback(value));
  }

  function copyTextToClipboardFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }

    document.body.removeChild(textarea);
    return copied;
  }

  function initMypagePrizeDetail() {
    const listView = document.getElementById('winnerListView');
    const detail = document.getElementById('prizeDetail');
    const dialog = detail?.querySelector('.prize-detail__dialog');
    const closeBtn = document.getElementById('prizeDetailClose');
    const copyBtn = document.getElementById('prizeDetailCopy');
    const copyMsg = document.getElementById('prizeDetailCopyMsg');
    if (!listView || !detail) return;

    let lastFocused = null;

    let copyMsgTimer = null;

    function hideCopyMsg() {
      if (copyMsgTimer) {
        clearTimeout(copyMsgTimer);
        copyMsgTimer = null;
      }
      if (copyMsg) copyMsg.hidden = true;
    }

    function showCopyMsg() {
      if (!copyMsg) return;
      hideCopyMsg();
      copyMsg.hidden = false;
      copyMsgTimer = setTimeout(hideCopyMsg, 2000);
    }

    const fields = {
      icon: document.getElementById('prizeDetailIcon'),
      game: document.getElementById('prizeDetailGame'),
      date: document.getElementById('prizeDetailDate'),
      live: document.getElementById('prizeDetailLive'),
      event: document.getElementById('prizeDetailEvent'),
      reward: document.getElementById('prizeDetailReward'),
      coupon: document.getElementById('prizeDetailCoupon'),
      expiry: document.getElementById('prizeDetailExpiry'),
    };

    function closeDetail() {
      if (detail.hidden) return;
      hideCopyMsg();
      detail.hidden = true;
      document.body.style.overflow = '';
      lastFocused?.focus();
      lastFocused = null;
    }

    function openDetail(btn) {
      hideCopyMsg();
      const dataset = btn.dataset;
      if (fields.icon) {
        fields.icon.textContent = dataset.prizeIcon || '';
        fields.icon.style.background = dataset.prizeColor ? `${dataset.prizeColor}33` : 'rgba(255,255,255,0.2)';
      }
      if (fields.game) fields.game.textContent = dataset.prizeGame || '';
      if (fields.date) fields.date.textContent = dataset.prizeDate || '';
      if (fields.live) fields.live.textContent = dataset.prizeLive || '';
      if (fields.event) fields.event.textContent = dataset.prizeEvent || '';
      if (fields.reward) fields.reward.textContent = dataset.prizeReward || '';
      if (fields.coupon) fields.coupon.textContent = dataset.prizeCoupon || '';
      if (fields.expiry) {
        fields.expiry.textContent = dataset.prizeExpiry
          ? `쿠폰 유효기간 ${dataset.prizeExpiry} 까지`
          : '';
      }

      lastFocused = btn;
      detail.hidden = false;
      document.body.style.overflow = 'hidden';
      if (dialog) dialog.scrollTop = 0;
      closeBtn?.focus();
    }

    document.querySelectorAll('[data-prize-open]').forEach((btn) => {
      btn.addEventListener('click', () => openDetail(btn));
    });

    closeBtn?.addEventListener('click', closeDetail);
    document.addEventListener('prize-detail-close', closeDetail);

    detail.addEventListener('click', (event) => {
      if (event.target === detail) closeDetail();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !detail.hidden) closeDetail();
    });

    copyBtn?.addEventListener('click', async () => {
      const code = fields.coupon?.textContent?.trim();
      if (!code) return;

      const copied = await copyTextToClipboard(code);
      if (!copied) return;

      copyBtn.classList.add('prize-detail__copy--copied');
      copyBtn.setAttribute('aria-label', '복사됨');
      showCopyMsg();
      setTimeout(() => {
        copyBtn.classList.remove('prize-detail__copy--copied');
        copyBtn.setAttribute('aria-label', '쿠폰 코드 복사');
      }, 2000);
    });
  }

  /* ===== My Page Notice & Settings ===== */
  function initMypageNotice() {
    const toggle = document.getElementById('broadcastNotifyToggle');
    toggle?.addEventListener('click', () => {
      const isOn = toggle.classList.toggle('toggle-switch--on');
      toggle.setAttribute('aria-checked', String(isOn));
    });

    const editBtn = document.getElementById('editNotifyGamesBtn');
    const overlay = document.getElementById('notifyGamesModalOverlay');
    const closeBtn = document.getElementById('notifyGamesModalClose');
    const cancelBtn = document.getElementById('notifyGamesCancelBtn');
    const saveBtn = document.getElementById('notifyGamesSaveBtn');
    const gamesText = document.getElementById('notifyGamesText');
    if (!editBtn || !overlay) return;

    const checkboxes = overlay.querySelectorAll('input[type="checkbox"]');
    let savedState = Array.from(checkboxes).map((cb) => cb.checked);

    function openModal() {
      savedState = Array.from(checkboxes).map((cb) => cb.checked);
      overlay.hidden = false;
    }

    function closeModal(restore) {
      if (restore) {
        checkboxes.forEach((cb, i) => { cb.checked = savedState[i]; });
      }
      overlay.hidden = true;
    }

    editBtn.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', () => closeModal(true));
    cancelBtn?.addEventListener('click', () => closeModal(true));

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeModal(true);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !overlay.hidden) closeModal(true);
    });

    saveBtn?.addEventListener('click', () => {
      const selected = Array.from(checkboxes)
        .filter((cb) => cb.checked)
        .map((cb) => cb.value);

      if (gamesText) {
        gamesText.textContent = selected.length ? selected.join(' · ') : '알림받는 게임이 없습니다';
      }
      closeModal(false);
    });
  }

  /* ===== My Page Game Filter ===== */
  function initMypageFilter() {
    document.querySelectorAll('.mypage__filter').forEach((filter) => {
      const btn = filter.querySelector('.mypage__filter-btn');
      const menu = filter.querySelector('.mypage__filter-menu');
      const label = filter.querySelector('.mypage__filter-label');
      const section = filter.closest('.mypage__section');
      const cards = section ? section.querySelectorAll('.mypage__filterable-card') : [];
      const emptyState = section ? section.querySelector('.mypage__empty') : null;
      const listTitle = section ? section.querySelector('.mypage__list-title') : null;
      if (!btn || !menu || !label) return;

      function closeMenu() {
        menu.hidden = true;
        filter.removeAttribute('data-open');
        btn.setAttribute('aria-expanded', 'false');
      }

      function openMenu() {
        menu.hidden = false;
        filter.setAttribute('data-open', 'true');
        btn.setAttribute('aria-expanded', 'true');
      }

      btn.addEventListener('click', () => {
        if (menu.hidden) openMenu();
        else closeMenu();
      });

      document.addEventListener('click', (event) => {
        if (!filter.contains(event.target)) closeMenu();
      });

      menu.querySelectorAll('.mypage__filter-option').forEach((option) => {
        option.addEventListener('click', () => {
          const game = option.dataset.game;

          menu.querySelectorAll('.mypage__filter-option').forEach((opt) => {
            opt.classList.remove('mypage__filter-option--active');
            opt.setAttribute('aria-selected', 'false');
          });
          option.classList.add('mypage__filter-option--active');
          option.setAttribute('aria-selected', 'true');
          const optionLabel = option.dataset.label || option.textContent.trim();
          label.textContent = optionLabel;

          let visibleCount = 0;
          cards.forEach((card) => {
            const match = game === 'all' || card.dataset.game === game;
            card.hidden = !match;
            if (match) visibleCount += 1;
          });
          if (emptyState) emptyState.hidden = visibleCount > 0;

          if (listTitle) {
            if (game === 'all') {
              listTitle.hidden = true;
            } else {
              listTitle.textContent = `${optionLabel} (${visibleCount})`;
              listTitle.hidden = false;
            }
          }

          closeMenu();
          document.dispatchEvent(new CustomEvent('vod-filter-changed'));
        });
      });
    });
  }

  /* ===== Channel Live Carousel ===== */
  function initChannelLiveCarousel() {
    document.querySelectorAll('[data-channel-live-carousel]').forEach((carousel) => {
      const track = carousel.querySelector('.channel-live-carousel__track');
      const slides = track ? [...track.children] : [];
      const prevBtn = carousel.querySelector('[data-carousel-prev]');
      const nextBtn = carousel.querySelector('[data-carousel-next]');
      const dots = [...carousel.querySelectorAll('[data-carousel-dot]')];
      const status = carousel.querySelector('[data-carousel-status]');
      if (!track || slides.length < 2) return;

      const slideCount = slides.length;
      let activeIndex = slides.findIndex((slide) => slide.querySelector('.badge-live, .badge-live__live'));
      if (activeIndex < 0) activeIndex = 0;

      function updateUi() {
        slides.forEach((slide, index) => {
          const relativePosition = (index - activeIndex + slideCount) % slideCount;
          const active = relativePosition === 0;

          slide.classList.remove('is-active', 'is-next', 'is-prev', 'is-queue-2');
          if (active) slide.classList.add('is-active');
          else if (relativePosition === 1) slide.classList.add('is-next');
          else if (relativePosition === 2) slide.classList.add('is-queue-2');

          slide.setAttribute('aria-hidden', String(!active));
          slide.querySelectorAll('a, button').forEach((el) => {
            if (active) el.removeAttribute('tabindex');
            else el.setAttribute('tabindex', '-1');
          });
        });

        dots.forEach((dot, index) => {
          const active = index === activeIndex;
          dot.classList.toggle('is-active', active);
          if (active) dot.setAttribute('aria-current', 'true');
          else dot.removeAttribute('aria-current');
        });

        if (status) {
          const label = dots[activeIndex]?.getAttribute('aria-label') || '';
          status.textContent = `${label}, ${activeIndex + 1} / ${slideCount}`;
        }
      }

      function move(step) {
        carousel.dataset.orbitDirection = step > 0 ? 'clockwise' : 'counterclockwise';
        activeIndex = (activeIndex + step + slideCount) % slideCount;
        updateUi();
      }

      function goTo(index) {
        if (index === activeIndex) return;
        carousel.dataset.orbitDirection = 'clockwise';
        activeIndex = index;
        updateUi();
      }

      slides.forEach((slide, index) => {
        slide.addEventListener('click', (event) => {
          if (index === activeIndex) return;
          event.preventDefault();
          goTo(index);
        });
      });

      prevBtn?.addEventListener('click', () => move(-1));
      nextBtn?.addEventListener('click', () => move(1));
      dots.forEach((dot, index) => dot.addEventListener('click', () => goTo(index)));

      carousel.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          move(-1);
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          move(1);
        }
      });

      updateUi();
      carousel.classList.add('is-ready');
    });
  }

  /* ===== Empty-state cyan wire mesh ===== */
  function initEmptyStateWaves() {
    const canvases = [...document.querySelectorAll('[data-empty-waves]')];
    if (!canvases.length) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

    canvases.forEach((canvas) => {
      const context = canvas.getContext('2d');
      const host = canvas.parentElement;
      if (!context || !host) return;

      let width = 1;
      let height = 1;
      let pixelRatio = 1;
      let frameId = 0;
      let lastFrameTime = 0;

      const meshLayers = [
        { horizon: 0.25, depth: 0.55, rows: 24, columns: 78, amplitude: 0.075, frequency: 4.2, speed: 0.15, phase: 2.4, alpha: 0.18, xShift: -0.08 },
        { horizon: 0.31, depth: 0.67, rows: 31, columns: 94, amplitude: 0.13, frequency: 5.1, speed: -0.11, phase: 0.6, alpha: 0.56, xShift: 0.04 },
      ];

      const glints = Array.from({ length: 36 }, (_, index) => ({
        x: ((index * 41 + 13) % 103) / 103,
        y: 0.3 + (((index * 59 + 5) % 64) / 100),
        radius: 0.45 + ((index * 11) % 10) / 12,
        phase: index * 0.73,
        alpha: 0.035 + ((index * 7) % 9) * 0.006,
      }));

      function resize() {
        const bounds = host.getBoundingClientRect();
        width = Math.max(1, Math.round(bounds.width));
        height = Math.max(1, Math.round(bounds.height));
        pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
      }

      function meshPoint(layer, column, row, time) {
        const u = column / (layer.columns - 1);
        const z = row / (layer.rows - 1);
        const worldX = (u - 0.5) * 2.25;
        const perspective = 0.5 + z * 0.68;
        const lateralFlow = time * layer.speed;
        const broadWave = Math.sin(worldX * layer.frequency + lateralFlow + layer.phase + z * 2.1);
        const crossingWave = Math.cos(worldX * 2.15 - z * 5.2 - lateralFlow * 0.62 + layer.phase) * 0.38;
        const crest = Math.sin(worldX * 7.4 + z * 3.7 + lateralFlow * 0.35) * 0.12;
        const elevation = (broadWave * 0.62 + crossingWave + crest) * layer.amplitude;
        const drift = Math.sin(time * 0.055 + layer.phase + z * 1.8) * width * 0.018;

        return {
          x: width * 0.5 + (worldX + layer.xShift) * width * 0.5 * perspective + drift,
          y: height * layer.horizon
            + Math.pow(z, 1.34) * height * layer.depth
            + elevation * height * (0.24 + z * 0.95),
          z,
        };
      }

      function drawMesh(layer, time) {
        const points = Array.from({ length: layer.rows }, () => Array(layer.columns));
        for (let row = 0; row < layer.rows; row += 1) {
          for (let column = 0; column < layer.columns; column += 1) {
            points[row][column] = meshPoint(layer, column, row, time);
          }
        }

        context.save();
        context.strokeStyle = '#57dcff';
        context.fillStyle = '#8cecff';
        context.lineCap = 'round';
        context.lineJoin = 'round';

        for (let row = 0; row < layer.rows; row += 1) {
          const z = row / (layer.rows - 1);
          context.beginPath();
          points[row].forEach((point, index) => {
            if (index === 0) context.moveTo(point.x, point.y);
            else context.lineTo(point.x, point.y);
          });
          context.globalAlpha = layer.alpha * (0.14 + z * 0.68);
          context.lineWidth = 0.35 + z * 0.5;
          context.stroke();
        }

        for (let column = 0; column < layer.columns; column += 2) {
          context.beginPath();
          for (let row = 0; row < layer.rows; row += 1) {
            const point = points[row][column];
            if (row === 0) context.moveTo(point.x, point.y);
            else context.lineTo(point.x, point.y);
          }
          context.globalAlpha = layer.alpha * 0.24;
          context.lineWidth = 0.35;
          context.stroke();
        }

        for (let row = 0; row < layer.rows; row += 1) {
          const z = row / (layer.rows - 1);
          const radius = 0.34 + z * 0.54;
          context.beginPath();
          for (let column = 0; column < layer.columns; column += 1) {
            const point = points[row][column];
            context.moveTo(point.x + radius, point.y);
            context.arc(point.x, point.y, radius, 0, Math.PI * 2);
          }
          context.globalAlpha = layer.alpha * (0.25 + z * 0.78);
          context.fill();
        }

        context.restore();
      }

      function drawGlints(time) {
        context.save();
        context.fillStyle = '#8eefff';
        glints.forEach((glint) => {
          const x = ((glint.x + time * 0.0016) % 1) * width;
          const y = (glint.y + Math.sin(time * 0.12 + glint.phase) * 0.012) * height;
          context.beginPath();
          context.arc(x, y, glint.radius, 0, Math.PI * 2);
          context.globalAlpha = glint.alpha;
          context.fill();
        });
        context.restore();
      }

      function drawBackground() {
        const vertical = context.createLinearGradient(0, 0, 0, height);
        vertical.addColorStop(0, '#00111f');
        vertical.addColorStop(0.52, '#001726');
        vertical.addColorStop(1, '#00101d');
        context.fillStyle = vertical;
        context.fillRect(0, 0, width, height);

        const glow = context.createRadialGradient(width * 0.52, height * 0.52, 0, width * 0.52, height * 0.52, width * 0.55);
        glow.addColorStop(0, 'rgba(18, 112, 145, 0.15)');
        glow.addColorStop(0.48, 'rgba(5, 65, 91, 0.08)');
        glow.addColorStop(1, 'rgba(0, 17, 31, 0)');
        context.fillStyle = glow;
        context.fillRect(0, 0, width, height);
      }

      function softenReadingZone() {
        const mask = context.createRadialGradient(width * 0.5, height * 0.52, 0, width * 0.5, height * 0.52, Math.min(width * 0.2, height * 0.32));
        mask.addColorStop(0, 'rgba(0, 17, 31, 0.86)');
        mask.addColorStop(0.55, 'rgba(0, 17, 31, 0.4)');
        mask.addColorStop(1, 'rgba(0, 17, 31, 0)');
        context.fillStyle = mask;
        context.fillRect(0, 0, width, height);
      }

      function render(timestamp = 0) {
        if (!motionPreference.matches && timestamp - lastFrameTime < 32) {
          frameId = window.requestAnimationFrame(render);
          return;
        }
        lastFrameTime = timestamp;
        const time = timestamp / 1000;
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.clearRect(0, 0, width, height);
        context.globalAlpha = 1;
        drawBackground();
        meshLayers.forEach((layer) => drawMesh(layer, time));
        drawGlints(time);
        softenReadingZone();
        context.globalAlpha = 1;

        if (!motionPreference.matches && !document.hidden) {
          frameId = window.requestAnimationFrame(render);
        }
      }

      function restart() {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
        lastFrameTime = 0;
        render(performance.now());
      }

      const resizeObserver = new ResizeObserver(() => {
        resize();
        restart();
      });
      resizeObserver.observe(host);

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          window.cancelAnimationFrame(frameId);
          frameId = 0;
        } else {
          restart();
        }
      });
      motionPreference.addEventListener?.('change', restart);

      resize();
      restart();
    });
  }
  /* ===== Empty-state cinematic ridge mesh ===== */
  function initEmptyStateRidgeMesh() {
    const canvases = [...document.querySelectorAll('[data-empty-waves]')];
    if (!canvases.length) return;
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

    canvases.forEach((canvas) => {
      const context = canvas.getContext('2d');
      const host = canvas.parentElement;
      if (!context || !host) return;

      let width = 1;
      let height = 1;
      let pixelRatio = 1;
      let frameId = 0;
      let lastFrameTime = 0;
      const palettes = {
        light: {
          background: '#f7fafb',
          glowInner: 'rgba(104, 159, 174, 0.12)',
          glowMiddle: 'rgba(158, 194, 204, 0.065)',
          line: '#708f99',
          node: '#557681',
          dust: '#6f929d',
          maskInner: 'rgba(247, 250, 251, 0.94)',
          maskMiddle: 'rgba(247, 250, 251, 0.62)',
          maskOuter: 'rgba(247, 250, 251, 0)',
          opacity: 0.72,
        },
        dark: {
          background: '#020508',
          glowInner: 'rgba(47, 130, 154, 0.095)',
          glowMiddle: 'rgba(13, 58, 75, 0.045)',
          line: '#dff9ff',
          node: '#ffffff',
          dust: '#e9fbff',
          maskInner: 'rgba(2, 5, 8, 0.92)',
          maskMiddle: 'rgba(2, 5, 8, 0.58)',
          maskOuter: 'rgba(2, 5, 8, 0)',
          opacity: 1,
        },
      };

      function getPalette() {
        return document.documentElement.getAttribute('data-theme') === 'dark'
          ? palettes.dark
          : palettes.light;
      }

      const layers = [
        { horizon: 0.34, depth: 0.34, rows: 16, columns: 46, amplitude: 0.105, alpha: 0.16, phase: 2.1, speed: -0.045, spread: 1.24 },
        { horizon: 0.31, depth: 0.54, rows: 23, columns: 60, amplitude: 0.165, alpha: 0.42, phase: 0.45, speed: 0.065, spread: 1.18 },
        { horizon: 0.39, depth: 0.55, rows: 29, columns: 70, amplitude: 0.205, alpha: 0.64, phase: 4.3, speed: -0.052, spread: 1.12 },
      ];

      const dust = Array.from({ length: 52 }, (_, index) => ({
        x: ((index * 47 + 17) % 113) / 113,
        y: 0.27 + (((index * 71 + 11) % 61) / 100),
        radius: 0.35 + ((index * 13) % 11) / 12,
        phase: index * 0.91,
        speed: 0.001 + ((index * 7) % 9) * 0.00016,
        alpha: 0.025 + ((index * 5) % 10) * 0.006,
      }));

      function resize() {
        const bounds = host.getBoundingClientRect();
        width = Math.max(1, Math.round(bounds.width));
        height = Math.max(1, Math.round(bounds.height));
        pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
      }

      function gaussian(value, center, spread) {
        const delta = (value - center) / spread;
        return Math.exp(-delta * delta);
      }

      function pointAt(layer, column, row, time) {
        const u = column / (layer.columns - 1);
        const z = row / (layer.rows - 1);
        const worldX = (u - 0.5) * 2.55;
        const flow = time * layer.speed;
        const movingPeak = -0.58 + Math.sin(time * 0.083 + layer.phase) * 0.34;
        const counterPeak = 0.58 + Math.cos(time * 0.061 + layer.phase) * 0.26;
        const tallRidge = gaussian(worldX, movingPeak, 0.34 + z * 0.12) * (0.84 + Math.sin(z * 5.4 + time * 0.21) * 0.1);
        const sideRidge = gaussian(worldX, counterPeak, 0.25 + z * 0.18) * 0.63;
        const rolling = Math.sin((worldX + flow) * 3.25 + z * 2.6 + layer.phase) * 0.27;
        const crossing = Math.cos(worldX * 6.15 - z * 5.8 - time * 0.14 + layer.phase) * 0.12;
        const breathing = Math.sin(time * 0.18 + z * 3.3 + layer.phase) * 0.08;
        const elevation = (tallRidge + sideRidge + rolling + crossing + breathing - 0.62) * layer.amplitude;
        const perspective = 0.38 + Math.pow(z, 0.82) * 0.78;
        const skew = Math.sin(z * 2.45 + time * 0.045 + layer.phase) * width * 0.035;
        const irregularX = Math.sin(column * 1.73 + row * 0.61 + layer.phase) * (0.7 + z * 1.25);
        const irregularY = Math.cos(column * 0.47 + row * 1.29 + layer.phase) * (0.45 + z * 0.8);
        return {
          x: width * 0.5 + worldX * width * 0.5 * layer.spread * perspective + skew + irregularX,
          y: height * layer.horizon + Math.pow(z, 1.42) * height * layer.depth - elevation * height * (0.7 + z * 0.55) + irregularY,
          z,
          energy: Math.max(0, tallRidge * 0.75 + sideRidge * 0.45 + rolling * 0.18),
        };
      }

      function strokeEdge(a, b, alpha, lineWidth) {
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.globalAlpha = alpha;
        context.lineWidth = lineWidth;
        context.stroke();
      }

      function drawLayer(layer, time, palette) {
        const points = Array.from({ length: layer.rows }, () => Array(layer.columns));
        for (let row = 0; row < layer.rows; row += 1) {
          for (let column = 0; column < layer.columns; column += 1) {
            points[row][column] = pointAt(layer, column, row, time);
          }
        }
        context.save();
        context.strokeStyle = palette.line;
        context.fillStyle = palette.node;
        context.lineCap = 'round';
        context.lineJoin = 'round';

        for (let row = 0; row < layer.rows; row += 1) {
          const z = row / (layer.rows - 1);
          for (let column = 0; column < layer.columns; column += 1) {
            const point = points[row][column];
            const depthAlpha = layer.alpha * (0.12 + z * 0.88);
            const pulse = 0.72 + Math.sin(time * 0.72 + column * 0.43 + row * 0.29 + layer.phase) * 0.28;
            const edgeAlpha = depthAlpha * (0.42 + point.energy * 0.58) * pulse * palette.opacity;
            const edgeWidth = 0.28 + z * 0.54;
            if (column < layer.columns - 1) strokeEdge(point, points[row][column + 1], edgeAlpha, edgeWidth);
            if (row < layer.rows - 1) strokeEdge(point, points[row + 1][column], edgeAlpha * 0.64, edgeWidth * 0.8);
            if (row < layer.rows - 1 && column < layer.columns - 1) {
              const diagonal = (row + column) % 2 === 0 ? points[row + 1][column + 1] : points[row + 1][column];
              const start = (row + column) % 2 === 0 ? point : points[row][column + 1];
              strokeEdge(start, diagonal, edgeAlpha * 0.48, edgeWidth * 0.72);
            }
          }
        }

        for (let row = 0; row < layer.rows; row += 1) {
          const z = row / (layer.rows - 1);
          for (let column = 0; column < layer.columns; column += 1) {
            const point = points[row][column];
            const shimmer = Math.max(0, Math.sin(time * 1.35 + column * 0.77 - row * 0.36 + layer.phase));
            const radius = 0.34 + z * 0.68 + shimmer * point.energy * 0.72;
            context.beginPath();
            context.arc(point.x, point.y, radius, 0, Math.PI * 2);
            context.globalAlpha = layer.alpha * (0.18 + z * 0.66) * (0.56 + shimmer * 0.44);
            context.fill();
          }
        }
        context.restore();
      }

      function drawDust(time, palette) {
        context.save();
        context.fillStyle = palette.dust;
        dust.forEach((particle) => {
          const x = ((particle.x + time * particle.speed) % 1.08 - 0.04) * width;
          const y = (particle.y + Math.sin(time * 0.19 + particle.phase) * 0.026) * height;
          const pulse = 0.45 + Math.max(0, Math.sin(time * 0.76 + particle.phase)) * 0.55;
          context.beginPath();
          context.arc(x, y, particle.radius * pulse, 0, Math.PI * 2);
          context.globalAlpha = particle.alpha * pulse * palette.opacity;
          context.fill();
        });
        context.restore();
      }

      function drawBackground(time, palette) {
        context.fillStyle = palette.background;
        context.fillRect(0, 0, width, height);
        const glowX = width * (0.5 + Math.sin(time * 0.055) * 0.16);
        const glow = context.createRadialGradient(glowX, height * 0.58, 0, glowX, height * 0.58, width * 0.48);
        glow.addColorStop(0, palette.glowInner);
        glow.addColorStop(0.45, palette.glowMiddle);
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        context.fillStyle = glow;
        context.fillRect(0, 0, width, height);
      }

      function softenReadingZone(palette) {
        const mask = context.createRadialGradient(width * 0.5, height * 0.49, 0, width * 0.5, height * 0.49, Math.min(width * 0.19, height * 0.29));
        mask.addColorStop(0, palette.maskInner);
        mask.addColorStop(0.52, palette.maskMiddle);
        mask.addColorStop(1, palette.maskOuter);
        context.fillStyle = mask;
        context.fillRect(0, 0, width, height);
      }

      function render(timestamp = 0) {
        if (!motionPreference.matches && timestamp - lastFrameTime < 32) {
          frameId = window.requestAnimationFrame(render);
          return;
        }
        lastFrameTime = timestamp;
        const time = timestamp / 1000;
        const palette = getPalette();
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.clearRect(0, 0, width, height);
        context.globalAlpha = 1;
        drawBackground(time, palette);
        layers.forEach((layer) => drawLayer(layer, time, palette));
        drawDust(time, palette);
        softenReadingZone(palette);
        context.globalAlpha = 1;
        if (!motionPreference.matches && !document.hidden) frameId = window.requestAnimationFrame(render);
      }

      function restart() {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
        lastFrameTime = 0;
        render(performance.now());
      }

      const resizeObserver = new ResizeObserver(() => {
        resize();
        restart();
      });
      resizeObserver.observe(host);
       const themeObserver = new MutationObserver(restart);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
     document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          window.cancelAnimationFrame(frameId);
          frameId = 0;
        } else {
          restart();
        }
      });
      motionPreference.addEventListener?.('change', restart);
      resize();
      restart();
    });
  }
  /* ===== Init ===== */
  function safeInit(name, fn) {
    try {
      fn();
    } catch (err) {
      console.error(`[NXlive] ${name} init failed:`, err);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    safeInit('initTheme', initTheme);
    safeInit('initSidebar', initSidebar);
    safeInit('initTooltips', initTooltips);
    safeInit('initVodFilters', initVodFilters);
    safeInit('initCountdowns', initCountdowns);
    safeInit('initChannelLiveCarousel', initChannelLiveCarousel);
    safeInit('initEmptyStateRidgeMesh', initEmptyStateRidgeMesh);
    safeInit('initCardClicks', initCardClicks);
    safeInit('initHeroHover', initHeroHover);
    safeInit('initHeroRolls', initHeroRolls);
    safeInit('initLiveIndex', initLiveIndex);
    safeInit('initThumbPreviews', initThumbPreviews);
    safeInit('initChannelNotify', initChannelNotify);
    safeInit('initNotifySubscribe', initNotifySubscribe);
    safeInit('initMypageTabs', initMypageTabs);
    safeInit('initMypagePrizeDetail', initMypagePrizeDetail);
    safeInit('initMypageFilter', initMypageFilter);
    safeInit('initMypageNotice', initMypageNotice);
    safeInit('initVodPagination', initVodPagination);

    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  });
})();


