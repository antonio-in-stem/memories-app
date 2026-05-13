import {
  filterProfiles,
  getInitials,
  memoryMatches,
  normalizeDirectory,
  summarizeDirectory,
} from './data.js';

const DATA_URL = 'data/profiles.json';
const THEME_KEY = 'memories.theme';
const HERO_INTERVAL_MS = 6800;
const DIALOG_CLOSE_MS = 260;
const DIALOG_SWITCH_MS = 150;

const heroScenes = [
  {
    eyebrow: 'Generation CH65',
    title: 'Professional memories',
    deck: 'Recognition, craft, and collaboration captured as a polished professional archive.',
  },
  {
    eyebrow: 'Signal room',
    title: 'Team signal wall',
    deck: 'A cinematic pulse of handoffs, saves, and the people who keep the work moving.',
  },
  {
    eyebrow: 'Story archive',
    title: 'Stories behind the work',
    deck: 'Long-form memories preserved with the context, image, and gratitude they deserve.',
  },
];

const state = {
  directory: null,
  activeProfile: 'all',
  query: '',
  heroIndex: 0,
  heroTimer: null,
  modalMemories: [],
  modalIndex: 0,
  modalCloseTimer: null,
  modalSwitchTimer: null,
};

const elements = {};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  cacheElements();
  applyTheme(readStorage(THEME_KEY) || 'light');
  bindEvents();
  await loadDirectory();
}

function cacheElements() {
  Object.assign(elements, {
    generationLabel: document.querySelector('#generationLabel'),
    generationTitle: document.querySelector('#generationTitle'),
    heroStage: document.querySelector('#heroStage'),
    heroDeck: document.querySelector('.hero-deck'),
    heroDots: document.querySelector('#heroDots'),
    summaryPanel: document.querySelector('#summaryPanel'),
    profileRail: document.querySelector('#profileRail'),
    railPrev: document.querySelector('#railPrev'),
    railNext: document.querySelector('#railNext'),
    dataAlerts: document.querySelector('#dataAlerts'),
    feedList: document.querySelector('#feedList'),
    feedCount: document.querySelector('#feedCount'),
    spotlightPanel: document.querySelector('#spotlightPanel'),
    leaderboardPanel: document.querySelector('#leaderboardPanel'),
    search: document.querySelector('#globalSearch'),
    themeToggle: document.querySelector('#themeToggle'),
    dialog: document.querySelector('#memoryDialog'),
    dialogContent: document.querySelector('#dialogContent'),
    dialogClose: document.querySelector('#dialogClose'),
    dialogPrev: document.querySelector('#dialogPrev'),
    dialogNext: document.querySelector('#dialogNext'),
  });
}

function bindEvents() {
  elements.search.addEventListener('input', (event) => {
    state.query = event.target.value;
    renderProfileRail();
    renderFeed();
    renderSpotlight();
  });

  elements.profileRail.addEventListener('click', (event) => {
    const button = event.target.closest('[data-profile]');
    if (!button) {
      return;
    }

    state.activeProfile = button.dataset.profile;
    renderAll();
  });

  elements.themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.bsTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    writeStorage(THEME_KEY, nextTheme);
  });

  elements.railPrev.addEventListener('click', () => scrollProfileRail(-1));
  elements.railNext.addEventListener('click', () => scrollProfileRail(1));

  elements.heroDots.addEventListener('click', (event) => {
    const button = event.target.closest('[data-hero-scene]');
    if (!button) {
      return;
    }

    setHeroScene(Number(button.dataset.heroScene), true);
  });

  elements.feedList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-heart]');

    if (button) {
      bumpHeart(button.dataset.heart);
      return;
    }

    const storyButton = event.target.closest('[data-open-memory]');
    if (storyButton) {
      openMemoryDialog(storyButton.dataset.openMemory);
    }
  });

  elements.dialogClose.addEventListener('click', closeMemoryDialog);
  elements.dialogPrev.addEventListener('click', () => navigateMemoryStack(-1));
  elements.dialogNext.addEventListener('click', () => navigateMemoryStack(1));
  elements.dialogContent.addEventListener('click', (event) => {
    const button = event.target.closest('[data-heart]');

    if (button) {
      bumpHeart(button.dataset.heart);
    }
  });
  elements.dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeMemoryDialog();
  });
  elements.dialog.addEventListener('click', (event) => {
    if (event.target === elements.dialog) {
      closeMemoryDialog();
    }
  });
  elements.dialog.addEventListener('close', resetMemoryDialog);
}

async function loadDirectory() {
  renderLoadState('Loading memories...');

  try {
    const response = await fetch(DATA_URL, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`Data request failed with status ${response.status}.`);
    }

    state.directory = normalizeDirectory(await response.json());
    state.activeProfile = pickDefaultProfile(state.directory);
    renderAll();
  } catch (error) {
    renderLoadError(error);
  }
}

function renderAll() {
  if (!state.directory) {
    return;
  }

  renderHeroControls();
  setHeroScene(state.heroIndex, false);
  renderSummary();
  renderDataAlerts();
  renderProfileRail();
  renderFeed();
  renderSpotlight();
  renderLeaderboard();
}

function renderHeroControls() {
  if (elements.heroDots.childElementCount > 0) {
    return;
  }

  heroScenes.forEach((scene, index) => {
    const dot = el('button', 'hero-dot');
    dot.type = 'button';
    dot.dataset.heroScene = String(index);
    dot.setAttribute('aria-label', `Show hero scene ${index + 1}: ${scene.eyebrow}`);
    elements.heroDots.append(dot);
  });

  startHeroRotation();
}

function startHeroRotation() {
  window.clearInterval(state.heroTimer);
  state.heroTimer = window.setInterval(() => {
    setHeroScene((state.heroIndex + 1) % heroScenes.length, false);
  }, HERO_INTERVAL_MS);
}

function setHeroScene(index, restartTimer) {
  const nextIndex = Number.isFinite(index) ? index : 0;
  const scene = heroScenes[nextIndex] || heroScenes[0];
  state.heroIndex = nextIndex;
  elements.heroStage.dataset.scene = String(nextIndex);
  elements.generationLabel.textContent = scene.eyebrow;
  elements.generationTitle.textContent = scene.title;
  elements.heroDeck.textContent = scene.deck;

  [...elements.heroDots.children].forEach((dot, dotIndex) => {
    dot.setAttribute('aria-pressed', String(dotIndex === nextIndex));
  });

  if (restartTimer) {
    startHeroRotation();
  }
}

function renderSummary() {
  const summary = summarizeDirectory(state.directory);
  clearElement(elements.summaryPanel);

  const metrics = [
    ['People', summary.profileCount],
    ['Memories', summary.memoryCount],
    ['Hearts', summary.heartCount],
    ['Comments', summary.commentCount],
  ];

  metrics.forEach(([label, value]) => {
    const item = el('div', 'metric-card');
    item.append(el('span', 'metric-value', formatNumber(value)), el('span', 'metric-label', label));
    elements.summaryPanel.append(item);
  });
}

function renderDataAlerts() {
  clearElement(elements.dataAlerts);

  if (state.directory.errors.length === 0) {
    return;
  }

  const alert = el('div', 'alert alert-warning mb-0');
  const title = el('strong', null, `${state.directory.errors.length} data issue(s) found.`);
  const detail = el('div', 'small mt-1', state.directory.errors.slice(0, 3).join(' '));

  alert.append(title, detail);
  elements.dataAlerts.append(alert);
}

function renderProfileRail() {
  clearElement(elements.profileRail);

  if (!state.directory) {
    return;
  }

  const visibleProfiles = filterProfiles(state.directory, state.query);
  elements.profileRail.append(createStoryButton(null));
  visibleProfiles.forEach((profile) => elements.profileRail.append(createStoryButton(profile)));
}

function createStoryButton(profile) {
  const username = profile?.username || 'all';
  const button = el('button', 'story-button');
  button.type = 'button';
  button.dataset.profile = username;
  button.setAttribute('aria-pressed', String(state.activeProfile === username));

  const ring = el('span', 'story-ring');
  applyRoleAccent(ring, profile?.role || 'lead');

  if (profile?.profilePicture) {
    const image = document.createElement('img');
    image.src = profile.profilePicture;
    image.alt = '';
    image.loading = 'lazy';
    ring.append(image);
  } else {
    ring.append(createAllGlyph());
  }

  const label = el('span', 'story-label', profile?.name || 'All');
  const count = el('span', 'story-count', profile ? `${profile.memoryCount} memories` : 'Full feed');

  button.append(ring, label, count);
  return button;
}

function renderFeed() {
  clearElement(elements.feedList);

  if (!state.directory) {
    return;
  }

  const visibleMemories = getVisibleMemories();
  elements.feedCount.textContent = `${visibleMemories.length} ${visibleMemories.length === 1 ? 'memory' : 'memories'}`;

  if (visibleMemories.length === 0) {
    elements.feedList.append(createEmptyState());
    return;
  }

  visibleMemories.forEach((memory, index) => {
    elements.feedList.append(createMemoryCard(memory, index === 0));
  });
}

function createMemoryCard(memory, featured = false) {
  const card = el('article', featured ? 'memory-card memory-card-featured' : 'memory-card');
  const heartButton = createHeartButton(memory);

  if (memory.image) {
    const imageWrap = el('div', 'memory-image-wrap');
    const image = document.createElement('img');
    image.src = memory.image;
    image.alt = `Memory for ${memory.recipient.name}`;
    image.loading = 'lazy';
    image.addEventListener('error', () => image.remove());
    imageWrap.append(image, el('span', 'image-sheen'), heartButton);
    card.append(imageWrap);
  }

  const content = el('div', 'memory-content');
  const header = el('header', 'memory-card-header');
  const route = el('div', 'memory-route');
  const authorText = el('div', 'route-text');
  authorText.append(
    el('strong', null, `${memory.author.name} to ${memory.recipient.name}`),
    createRolePair(memory.author.role, memory.recipient.role),
  );

  route.append(createAvatar(memory.author), createRouteMark(), createAvatar(memory.recipient), authorText);

  header.append(route);
  if (!memory.image) {
    header.append(heartButton);
  }
  content.append(header);

  const body = el('div', 'memory-body');
  body.append(el('p', null, memory.shoutout));
  content.append(body);

  const meta = el('div', 'memory-meta');
  meta.append(
    createChip(`${memory.comments.length} comments`),
    createChip(formatDate(memory.createdAt)),
    createStoryBadge(memory.id),
  );
  content.append(meta);

  if (memory.comments.length > 0) {
    content.append(createCommentList(memory.comments));
  }

  card.append(content);
  return card;
}

function createHeartButton(memory) {
  const heartButton = el('button', 'heart-button');
  heartButton.type = 'button';
  heartButton.dataset.heart = memory.id;
  heartButton.setAttribute('aria-label', `Add heart to memory for ${memory.recipient.name}`);
  heartButton.append(icon('heart'), el('strong', null, formatNumber(memory.heartCount)));
  return heartButton;
}

function createRouteMark() {
  const mark = el('span', 'route-mark');
  mark.setAttribute('aria-hidden', 'true');
  return mark;
}

function createRolePair(authorRole, recipientRole) {
  const roles = el('span', 'route-roles');
  const authorBadge = el('span', null, authorRole);
  const recipientBadge = el('span', null, recipientRole);
  applyRoleAccent(authorBadge, authorRole);
  applyRoleAccent(recipientBadge, recipientRole);
  roles.append(authorBadge, recipientBadge);
  return roles;
}

function createCommentList(comments) {
  const details = el('details', 'comment-list');
  details.append(el('summary', null, 'View comments'));

  comments.forEach((comment) => {
    const item = el('div', 'comment-item');
    const text = el('div');
    const header = el('div', 'comment-heading');
    header.append(el('strong', null, comment.profile.name), el('time', null, formatDate(comment.createdAt)));
    const roleBadge = el('span', 'comment-role', comment.profile.role);
    applyRoleAccent(roleBadge, comment.profile.role);
    text.append(header, roleBadge, el('p', null, comment.body));
    item.append(createAvatar(comment.profile, 'avatar-sm'), text);
    details.append(item);
  });

  return details;
}

function renderSpotlight() {
  clearElement(elements.spotlightPanel);

  if (!state.directory) {
    return;
  }

  const profile = getSpotlightProfile();
  const relatedMemories = state.directory.feed.filter(
    (memory) => memory.recipient.username === profile.username,
  );
  const latestMemory = relatedMemories[0];
  const heartTotal = relatedMemories.reduce((total, memory) => total + memory.heartCount, 0);

  const hero = el('div', 'spotlight-hero');
  hero.append(createAvatar(profile, 'avatar-xl'));

  const title = el('div');
  title.append(el('span', 'panel-eyebrow', 'Spotlight'), el('h2', null, profile.name), el('p', null, profile.role));
  hero.append(title);

  const stats = el('div', 'spotlight-stats');
  stats.append(createSpotlightStat('Memories', profile.memoryCount), createSpotlightStat('Hearts', heartTotal));

  elements.spotlightPanel.append(hero, stats);

  if (latestMemory) {
    const quote = el('blockquote', 'spotlight-quote');
    quote.append(el('p', null, latestMemory.body), el('footer', null, `From ${latestMemory.author.name}`));
    elements.spotlightPanel.append(quote);
  }
}

function renderLeaderboard() {
  clearElement(elements.leaderboardPanel);
  const summary = summarizeDirectory(state.directory);

  const header = el('div', 'panel-header');
  header.append(el('span', 'panel-eyebrow', 'Most remembered'), el('h2', null, 'Recognition board'));
  elements.leaderboardPanel.append(header);

  summary.topProfiles.forEach((profile, index) => {
    const row = el('button', 'leader-row');
    row.type = 'button';
    row.dataset.profile = profile.username;
    row.addEventListener('click', () => {
      state.activeProfile = profile.username;
      renderAll();
    });

    row.append(
      el('span', 'leader-rank', String(index + 1).padStart(2, '0')),
      createAvatar(profile, 'avatar-sm'),
      createLeaderText(profile),
      el('span', 'leader-score', String(profile.memoryCount)),
    );
    elements.leaderboardPanel.append(row);
  });
}

function createLeaderText(profile) {
  const text = el('span', 'leader-text');
  text.append(el('strong', null, profile.name), el('span', null, profile.role));
  return text;
}

function createSpotlightStat(label, value) {
  const item = el('div', 'spotlight-stat');
  item.append(el('strong', null, formatNumber(value)), el('span', null, label));
  return item;
}

function createChip(text) {
  return el('span', 'meta-chip', text);
}

function createStoryBadge(memoryId) {
  const badge = el('button', 'story-badge');
  badge.type = 'button';
  badge.dataset.openMemory = memoryId;
  badge.append(icon('book'), el('span', null, 'Read story'), icon('arrow'));
  return badge;
}

function openMemoryDialog(memoryId) {
  const visibleMemories = getVisibleMemories();
  const visibleIndex = visibleMemories.findIndex((item) => item.id === memoryId);
  state.modalMemories = visibleIndex >= 0 ? visibleMemories : state.directory.feed;
  state.modalIndex = Math.max(0, state.modalMemories.findIndex((item) => item.id === memoryId));
  const memory = getActiveDialogMemory();

  if (!memory) {
    return;
  }

  window.clearTimeout(state.modalCloseTimer);
  window.clearTimeout(state.modalSwitchTimer);
  elements.dialog.classList.remove('is-closing');
  renderMemoryDialog(memory);

  if (!elements.dialog.open) {
    elements.dialog.showModal();
  }

  window.requestAnimationFrame(() => {
    elements.dialog.classList.add('is-visible');
    elements.dialogContent.classList.add('stack-settle');
  });
}

function closeMemoryDialog() {
  if (!elements.dialog.open || elements.dialog.classList.contains('is-closing')) {
    return;
  }

  elements.dialog.classList.remove('is-visible');
  elements.dialog.classList.add('is-closing');
  window.clearTimeout(state.modalCloseTimer);
  state.modalCloseTimer = window.setTimeout(() => {
    elements.dialog.close();
  }, DIALOG_CLOSE_MS);
}

function resetMemoryDialog() {
  window.clearTimeout(state.modalCloseTimer);
  window.clearTimeout(state.modalSwitchTimer);
  elements.dialog.classList.remove('is-visible', 'is-closing');
  elements.dialogContent.classList.remove('stack-next', 'stack-prev', 'stack-settle');
}

function navigateMemoryStack(direction) {
  if (state.modalMemories.length <= 1 || elements.dialogContent.classList.contains('is-switching')) {
    return;
  }

  const nextIndex = (state.modalIndex + direction + state.modalMemories.length) % state.modalMemories.length;
  const directionClass = direction > 0 ? 'stack-next' : 'stack-prev';
  state.modalIndex = nextIndex;
  elements.dialogContent.classList.remove('stack-settle', 'stack-next', 'stack-prev');
  elements.dialogContent.classList.add('is-switching', directionClass);

  window.clearTimeout(state.modalSwitchTimer);
  state.modalSwitchTimer = window.setTimeout(() => {
    renderMemoryDialog(getActiveDialogMemory());
    elements.dialogContent.classList.remove('is-switching', directionClass);
    window.requestAnimationFrame(() => {
      elements.dialogContent.classList.add('stack-settle');
    });
  }, DIALOG_SWITCH_MS);
}

function getActiveDialogMemory() {
  return state.modalMemories[state.modalIndex] || null;
}

function renderMemoryDialog(memory) {
  clearElement(elements.dialogContent);

  const dialogMedia = el('div', 'dialog-media');
  if (memory.image) {
    const image = document.createElement('img');
    image.src = memory.image;
    image.alt = `Memory for ${memory.recipient.name}`;
    dialogMedia.append(image);
  }

  const dialogBody = el('div', 'dialog-body');
  const header = el('header', 'dialog-header');
  const route = el('div', 'memory-route');
  const routeText = el('div', 'route-text');
  routeText.append(
    el('strong', null, `${memory.author.name} to ${memory.recipient.name}`),
    createRolePair(memory.author.role, memory.recipient.role),
  );
  route.append(createAvatar(memory.author), createRouteMark(), createAvatar(memory.recipient), routeText);
  header.append(route, createHeartButton(memory));

  const title = el('h2', null, memory.shoutout);
  title.id = 'memoryDialogTitle';
  const story = el('p', 'dialog-story', memory.body);
  const meta = el('div', 'memory-meta');
  meta.append(
    createChip(`${state.modalIndex + 1} of ${state.modalMemories.length}`),
    createChip(formatDate(memory.createdAt)),
    createChip(`${memory.comments.length} comments`),
  );

  dialogBody.append(header, title, story, meta);

  if (memory.comments.length > 0) {
    dialogBody.append(createCommentList(memory.comments));
  }

  elements.dialogContent.append(dialogMedia, dialogBody);
  updateDialogNavigation();
}

function updateDialogNavigation() {
  const hasStack = state.modalMemories.length > 1;
  elements.dialogPrev.disabled = !hasStack;
  elements.dialogNext.disabled = !hasStack;
  elements.dialogPrev.setAttribute('aria-hidden', String(!hasStack));
  elements.dialogNext.setAttribute('aria-hidden', String(!hasStack));
}

function createEmptyState() {
  const empty = el('div', 'empty-state');
  empty.append(
    el('strong', null, 'No memories found'),
    el('span', null, 'Try another profile or search term.'),
  );
  return empty;
}

function renderLoadState(message) {
  clearElement(elements.feedList);
  const stateBlock = el('div', 'load-state');
  stateBlock.append(el('strong', null, message));
  elements.feedList.append(stateBlock);
}

function renderLoadError(error) {
  clearElement(elements.feedList);
  const stateBlock = el('div', 'load-state');
  stateBlock.append(
    el('strong', null, 'Could not load data/profiles.json'),
    el('span', null, 'Run a static server so the browser can fetch local JSON files.'),
  );
  elements.feedList.append(stateBlock);
  console.error(error);
}

function bumpHeart(memoryId) {
  const memory = state.directory.feed.find((item) => item.id === memoryId);

  if (!memory) {
    return;
  }

  memory.heartCount += 1;
  renderSummary();
  document.querySelectorAll(`[data-heart="${CSS.escape(memoryId)}"] strong`).forEach((count) => {
    count.textContent = formatNumber(memory.heartCount);
  });
  renderSpotlight();
}

function getVisibleMemories() {
  return state.directory.feed.filter((memory) => {
    const profileMatches =
      state.activeProfile === 'all' || memory.recipient.username === state.activeProfile;
    return profileMatches && memoryMatches(memory, state.query);
  });
}

function getSpotlightProfile() {
  if (state.activeProfile !== 'all') {
    return state.directory.byUsername.get(state.activeProfile) || state.directory.profiles[0];
  }

  const visibleMemories = getVisibleMemories();
  return visibleMemories[0]?.recipient || pickDefaultProfileObject(state.directory);
}

function createAvatar(profile, extraClass = '') {
  const avatar = el('span', ['avatar', extraClass].filter(Boolean).join(' '));
  applyRoleAccent(avatar, profile.role);

  if (profile.profilePicture) {
    const image = document.createElement('img');
    image.src = profile.profilePicture;
    image.alt = '';
    image.loading = 'lazy';
    image.addEventListener('error', () => {
      clearElement(avatar);
      avatar.textContent = getInitials(profile.name);
    });
    avatar.append(image);
  } else {
    avatar.textContent = getInitials(profile.name);
  }

  return avatar;
}

function createAllGlyph() {
  const glyph = el('span', 'avatar avatar-all');
  glyph.append(icon('spark'));
  return glyph;
}

function scrollProfileRail(direction) {
  const distance = Math.max(280, elements.profileRail.clientWidth * 0.72);
  elements.profileRail.scrollBy({ left: direction * distance, behavior: 'smooth' });
}

function applyRoleAccent(element, role) {
  const palette = getRolePalette(role);
  element.style.setProperty('--role-a', palette[0]);
  element.style.setProperty('--role-b', palette[1]);
  element.style.setProperty('--role-c', palette[2]);
}

function getRolePalette(role = '') {
  const normalizedRole = role.toLowerCase();

  if (normalizedRole.includes('lead') || normalizedRole.includes('master')) {
    return ['#EAB308', '#9333EA', '#06B6D4'];
  }

  if (normalizedRole.includes('frontend') || normalizedRole.includes('mobile') || normalizedRole.includes('full stack')) {
    return ['#38BDF8', '#6366F1', '#F472B6'];
  }

  if (normalizedRole.includes('backend') || normalizedRole.includes('platform') || normalizedRole.includes('devops')) {
    return ['#22C55E', '#06B6D4', '#2563EB'];
  }

  if (normalizedRole.includes('design') || normalizedRole.includes('research') || normalizedRole.includes('content')) {
    return ['#FB7185', '#F59E0B', '#A855F7'];
  }

  if (normalizedRole.includes('qa') || normalizedRole.includes('security') || normalizedRole.includes('analyst')) {
    return ['#14B8A6', '#84CC16', '#EAB308'];
  }

  return ['#A855F7', '#EC4899', '#F97316'];
}

function pickDefaultProfile(directory) {
  return pickDefaultProfileObject(directory)?.username || 'all';
}

function pickDefaultProfileObject(directory) {
  return [...directory.profiles]
    .sort((left, right) => right.memoryCount - left.memoryCount)
    .find((profile) => profile.memoryCount > 0) || directory.profiles[0];
}

function applyTheme(theme) {
  document.documentElement.dataset.bsTheme = theme;
  elements.themeToggle.querySelector('span').textContent = theme === 'dark' ? '☀' : '◐';
}

function formatDate(value) {
  if (!value) {
    return 'Recently';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function icon(name) {
  const icons = {
    heart:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.2s-7.2-4.4-9.2-8.7C1.3 8.2 3.2 5 6.6 5c2 0 3.4 1.1 4.2 2.2C11.6 6.1 13 5 15 5c3.4 0 5.3 3.2 3.8 6.5C19.2 15.8 12 20.2 12 20.2Z"/></svg>',
    book:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 4.5h8.2A3.3 3.3 0 0 1 18 7.8v11.7H7.5A2.5 2.5 0 0 1 5 17V6a1.5 1.5 0 0 1 1.5-1.5Zm1 2V15h8.5V7.8a1.3 1.3 0 0 0-1.3-1.3H7.5Zm0 10.5a.5.5 0 0 0 0 1H16v-1H7.5Z"/></svg>',
    arrow:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 5.2a1 1 0 0 1 1.4 0l6.1 6.1a1 1 0 0 1 0 1.4l-6.1 6.1a1 1 0 1 1-1.4-1.4l4.4-4.4H4a1 1 0 1 1 0-2h13.6l-4.4-4.4a1 1 0 0 1 0-1.4Z"/></svg>',
    spark:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8 14.8 9l6.4 3-6.4 3L12 21.2 9.2 15l-6.4-3 6.4-3L12 2.8Z"/></svg>',
  };
  const span = el('span', 'icon');
  span.innerHTML = icons[name] || icons.spark;
  return span;
}

function formatNumber(value) {
  return new Intl.NumberFormat('en', { notation: value > 999 ? 'compact' : 'standard' }).format(value);
}

function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return null;
  }
}

function clearElement(element) {
  element.replaceChildren();
}

function el(tag, className, text) {
  const node = document.createElement(tag);

  if (className) {
    node.className = className;
  }

  if (text !== undefined && text !== null) {
    node.textContent = text;
  }

  return node;
}
