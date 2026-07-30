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
          const heroState = panel.closest('.hero-state');
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
          const heroState = panel.closest('.hero-state');
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
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
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
        let left = rect.right + gap;
        let top = rect.top + (rect.height - tipRect.height) / 2;

        if (left + tipRect.width > window.innerWidth - 8) {
          left = rect.left - tipRect.width - gap;
        }

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

    function setProgress(ratio) {
      progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
    }

    function tick() {
      if (video.duration && !video.paused) {
        setProgress(video.currentTime / video.duration);
      }
      rafId = requestAnimationFrame(tick);
    }

    function startPreview() {
      container.classList.add(activeClass);

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
      container.classList.remove(activeClass);
      video.pause();
      video.currentTime = 0;
      setProgress(0);

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
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

      const liveIndex = heroState?.querySelector('.live-index');
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
  function initMypagePrizeDetail() {
    const listView = document.getElementById('winnerListView');
    const detail = document.getElementById('prizeDetail');
    const backBtn = document.getElementById('prizeDetailBack');
    const copyBtn = document.getElementById('prizeDetailCopy');
    if (!listView || !detail) return;

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
      detail.hidden = true;
      listView.hidden = false;
    }

    function openDetail(btn) {
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

      listView.hidden = true;
      detail.hidden = false;
      detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    document.querySelectorAll('[data-prize-open]').forEach((btn) => {
      btn.addEventListener('click', () => openDetail(btn));
    });

    backBtn?.addEventListener('click', closeDetail);
    document.addEventListener('prize-detail-close', closeDetail);

    copyBtn?.addEventListener('click', async () => {
      const code = fields.coupon?.textContent;
      if (!code) return;

      try {
        await navigator.clipboard.writeText(code);
        copyBtn.classList.add('prize-detail__copy--copied');
        copyBtn.setAttribute('aria-label', '복사됨');
        setTimeout(() => {
          copyBtn.classList.remove('prize-detail__copy--copied');
          copyBtn.setAttribute('aria-label', '쿠폰 코드 복사');
        }, 2000);
      } catch {
        const range = document.createRange();
        range.selectNodeContents(fields.coupon);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
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
    safeInit('initCardClicks', initCardClicks);
    safeInit('initHeroHover', initHeroHover);
    safeInit('initHeroRolls', initHeroRolls);
    safeInit('initLiveIndex', initLiveIndex);
    safeInit('initThumbPreviews', initThumbPreviews);
    safeInit('initChannelNotify', initChannelNotify);
    safeInit('initMypageTabs', initMypageTabs);
    safeInit('initMypagePrizeDetail', initMypagePrizeDetail);
    safeInit('initMypageFilter', initMypageFilter);
    safeInit('initMypageNotice', initMypageNotice);
    safeInit('initVodPagination', initVodPagination);

    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  });
})();
