// Fluent layer for the Aurora Theme (Fluent edition): the parts of the Windows 11 look that
// need a script. Each part checks for what it works on and does nothing elsewhere.
//   - the menu in groups (Overview, Storage, Apps & VMs, System), with a selection pill
//   - a command palette (Ctrl+K) over every page, setting, tool and quick action
//   - Settings and Tools cards with a one-line description
//   - a breadcrumb title on sub-pages
//   - the entrance of the page's cards, and the pointer light over cards
(function () {
  'use strict';

  const root = document.documentElement;
  if (!root.classList.contains('Theme--black') && !root.classList.contains('Theme--white')) return;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function icon(classes) {
    const node = element('i', classes);
    node.setAttribute('aria-hidden', 'true');
    return node;
  }

  // ---- What the pages and actions are for, shown in the palette and on the Settings and Tools
  // cards. Keyed by the last part of the page's address; pages not listed (most plugins) just
  // show their name.
  const DESCRIPTIONS = {
    Dashboard: 'Health, storage and services at a glance',
    Main: 'Array, pools, boot device and disk operations',
    Shares: 'User shares and disk shares',
    Users: 'Accounts for shares and the webGUI',
    Settings: 'System, network and preference settings',
    Plugins: 'Installed plugins and their updates',
    Docker: 'Containers, groups and their resources',
    VMs: 'Virtual machines and their resources',
    Apps: 'Community Applications: install new apps',
    Stats: 'CPU, memory, network and disk history',
    Tools: 'Diagnostics, logs and maintenance',
    // System settings
    BootParameters: 'Kernel and boot menu options',
    CPUset: 'Pin CPU cores to containers and VMs',
    DateTime: 'Time zone, NTP servers and clock',
    DiskSettings: 'Spin-down, auto-start, SMART and tunables',
    DockerSettings: 'Docker service, storage and networks',
    Identification: 'Server name, description and model',
    ManagementAccess: 'webGUI ports, SSL, SSH and Telnet',
    NetworkSettings: 'Interfaces, bonding, bridging and VLANs',
    PowerMode: 'CPU governor and power behaviour',
    ShareSettings: 'Disk and user share defaults',
    UPSsettings: 'UPS monitoring and safe shutdown',
    VMSettings: 'Libvirt, VM storage and default network',
    // Network services
    NFS: 'NFS exports and protocol options',
    SMB: 'Windows file sharing and workgroup',
    FTP: 'Built-in FTP server and its users',
    OutgoingProxy: 'Proxy for the server\'s own traffic',
    SyslogSettings: 'Send logs to, or receive them from, a syslog server',
    Tailscale: 'Tailnet membership and exit node',
    VPNmanager: 'WireGuard tunnels and peers',
    // User preferences
    Confirmations: 'Which actions ask before they run',
    Console: 'Keyboard layout and console screen',
    DisplaySettings: 'Theme, units, date format and page layout',
    Notifications: 'Agents, alerts and how often to check',
    Scheduler: 'Parity checks, mover and TRIM timing',
    AuroraThemeSettings: 'Theme, layout, animations and updates',
    // Tools
    Diagnostics: 'Collect logs and configuration for support',
    HardwareProfile: 'Send an anonymous hardware report',
    LogViewer: 'Browse every log file on the server',
    NewConfig: 'Reset the array configuration',
    NewPerms: 'Fix share file permissions',
    Processes: 'Running processes and their load',
    SysDevs: 'PCI and USB devices, IOMMU groups, VFIO binding',
    SysDrivers: 'Kernel modules and their options',
    Syslog: 'The live system log',
    Terminal: 'A shell on the server in the browser',
    Credits: 'The people behind Unraid',
    EULA: 'Unraid licence agreement',
    Language: 'Install languages for the webGUI',
    PHPsettings: 'PHP error log and settings',
    PageMap: 'Every webGUI page and where it lives',
    Vars: 'Internal variables of the webGUI',
    Update: 'Check for and install Unraid OS updates',
    Downgrade: 'Go back to the previous Unraid OS version',
    Registration: 'Licence key and registration',
    InternalBootWizard: 'Boot from an internal drive',
    OnboardingWizard: 'First-time setup assistant',
    // Common plugins
    UnassignedDevices: 'Mount disks and remote shares outside the array',
    UnassignedDevicesSettings: 'Unassigned Devices defaults and SMB/NFS options',
    Userscripts: 'Run and schedule your own scripts',
    FixProblems: 'Scan for common configuration problems',
    CommunityApplications: 'Community Applications options',
    AppdataBackup: 'Back up and restore container data',
    TipsAndTweaks: 'Kernel and network tweaks',
    nvidia: 'NVIDIA driver version and GPU info',
    'nvidia-driver': 'NVIDIA driver version and GPU info',
    GPUStatisticsSettings: 'GPU tile on the Dashboard',
    ZFSMaster: 'Datasets, snapshots and pools',
    DiskLocation: 'Where each disk sits in the case',
    FileManager: 'Dynamix File Manager options',
    AuroraTheme: 'Theme, layout, animations and updates',
  };

  const pageName = function (href) {
    try { return new URL(href, location.href).pathname.split('/').filter(Boolean).pop() || ''; } catch (error) { return ''; }
  };

  const path = location.pathname.split('/').filter(Boolean);
  const reduceMotion = root.classList.contains('fl-motion-off') || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // ======================================================================
  // Menu groups. The stock tabs are put in four groups with a heading each (sidebar) or a
  // hairline between them (top bar). Tabs from plugins go into "More", in their own order.
  // ======================================================================
  const GROUPS = [
    ['Overview', ['Dashboard', 'Stats']],
    ['Storage', ['Main', 'Shares']],
    ['Apps & VMs', ['Docker', 'VMs', 'Apps']],
    ['System', ['Users', 'Settings', 'Plugins', 'Tools']],
  ];

  function menuGroups() {
    const tile = document.querySelector('#menu .nav-tile:not(.right)');
    if (!tile || tile.querySelector('.fl-nav-header')) return;
    const items = [...tile.querySelectorAll(':scope > .nav-item')];
    if (items.length < 3) return;
    const byName = new Map();
    items.forEach(function (item) {
      const link = item.querySelector('a[href]');
      if (link) byName.set(pageName(link.getAttribute('href')), item);
    });
    const placed = new Set();
    const groups = GROUPS.map(function (group) {
      const members = group[1].map(function (name) { return byName.get(name); }).filter(Boolean);
      members.forEach(function (item) { placed.add(item); });
      return [group[0], members];
    });
    const rest = items.filter(function (item) { return !placed.has(item); });
    if (rest.length) groups.push(['More', rest]);

    let first = true;
    groups.forEach(function (group) {
      if (!group[1].length) return;
      if (!first) {
        const sep = element('div', 'fl-nav-sep');
        sep.setAttribute('aria-hidden', 'true');
        tile.append(sep);
      }
      const header = element('div', 'fl-nav-header', group[0]);
      header.setAttribute('aria-hidden', 'true');
      tile.append(header);
      group[1].forEach(function (item) { tile.append(item); });
      first = false;
    });
  }

  // The selection pill on the open tab. A click on another tab moves it there at once, so the
  // menu answers before the next page has arrived; the view transition then keeps it in place.
  function navPill() {
    const tile = document.querySelector('#menu .nav-tile:not(.right)');
    if (!tile) return;
    const pill = element('span', 'fl-pill');
    pill.setAttribute('aria-hidden', 'true');
    const active = tile.querySelector('.nav-item.active');
    if (active) active.append(pill);

    tile.addEventListener('click', function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest('.nav-item a[href]');
      const item = link && link.closest('.nav-item');
      if (!item || item.contains(pill) || link.target === '_blank') return;
      tile.querySelectorAll('.nav-item.fl-going').forEach(function (other) { other.classList.remove('fl-going'); });
      item.classList.add('fl-going');
      if (!pill.isConnected || reduceMotion) {
        item.append(pill);
        return;
      }
      const from = pill.getBoundingClientRect();
      item.append(pill);
      const to = pill.getBoundingClientRect();
      pill.animate([
        { transform: 'translate(' + (from.left - to.left) + 'px, ' + (from.top - to.top) + 'px)' },
        { transform: 'none' },
      ], { duration: 333, easing: 'cubic-bezier(0.1, 0.9, 0.2, 1)' });
    });
  }

  // ======================================================================
  // Quick actions in the sidebar: the most used stay as buttons, the rest move into the
  // command palette ("More"). The lock stays where lists can be rearranged.
  // ======================================================================
  const QUICK_KEEP = ['TerminalButton', 'BrowseButton', 'LogButton', 'HelpButton', 'LogoutButton'];

  function quickActions(openPalette) {
    const row = document.querySelector('#menu .nav-tile.right');
    if (!row || row.querySelector('.fl-more')) return;
    const sortable = ['Docker', 'VMs', 'Dashboard'].includes(path[0] || 'Dashboard');
    row.querySelectorAll(':scope > .nav-item.util').forEach(function (item) {
      const keep = QUICK_KEEP.some(function (name) { return item.classList.contains(name); }) ||
        (sortable && item.classList.contains('LockButton'));
      item.classList.toggle('fl-tucked', !keep);
    });
    const more = element('div', 'nav-item util fl-more');
    const link = element('a');
    link.href = '#';
    link.title = 'More actions (Ctrl+K)';
    link.setAttribute('aria-label', link.title);
    link.append(icon('fa fa-ellipsis-h system'));
    link.addEventListener('click', function (event) {
      event.preventDefault();
      openPalette('>');
    });
    more.append(link);
    row.append(more);
  }

  // ======================================================================
  // Command palette
  // ======================================================================
  const INDEX_KEY = 'fl-palette-index-v1';
  const RECENT_KEY = 'fl-palette-recent';
  const INDEX_AGE = 10 * 60 * 1000;

  function storage(kind) {
    try { return window[kind]; } catch (error) { return null; }
  }

  function readJson(kind, key, fallback) {
    const store = storage(kind);
    try { return JSON.parse((store && store.getItem(key)) || 'null') || fallback; } catch (error) { return fallback; }
  }

  function writeJson(kind, key, value) {
    const store = storage(kind);
    try { if (store) store.setItem(key, JSON.stringify(value)); } catch (error) { /* full or blocked */ }
  }

  // Settings and Tools cards of a page, read from its HTML: [{ title, href, section, icon, img }]
  function panelsOf(html, where) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const found = [];
    doc.querySelectorAll('.Panels .Panel a[href]').forEach(function (link) {
      const text = link.querySelector('.PanelText');
      const title = (text ? text.textContent : link.textContent).replace(/\s+/g, ' ').trim();
      if (!title) return;
      const group = link.closest('.Panels');
      const heading = group && group.previousElementSibling && group.previousElementSibling.matches('div.title') ? group.previousElementSibling.textContent.replace(/\s+/g, ' ').trim() : '';
      const iconNode = link.querySelector('i.PanelIcon, i[class*="icon-"], i.fa');
      const img = link.querySelector('img');
      found.push({
        title: title,
        href: link.getAttribute('href'),
        section: heading || where,
        where: where,
        icon: iconNode ? iconNode.className.replace(/\bPanelIcon\b/, '').trim() : '',
        img: img ? img.getAttribute('src') : '',
      });
    });
    return found;
  }

  let indexPromise = null;
  function settingsIndex() {
    if (indexPromise) return indexPromise;
    const cached = readJson('sessionStorage', INDEX_KEY, null);
    if (cached && Date.now() - cached.time < INDEX_AGE && Array.isArray(cached.items)) {
      indexPromise = Promise.resolve(cached.items);
      return indexPromise;
    }
    const load = function (where) {
      return fetch('/' + where, { credentials: 'same-origin' })
        .then(function (response) { return response.ok ? response.text() : ''; })
        .then(function (html) { return html ? panelsOf(html, where) : []; })
        .catch(function () { return []; });
    };
    indexPromise = Promise.all([load('Settings'), load('Tools')]).then(function (lists) {
      const items = lists[0].concat(lists[1]);
      writeJson('sessionStorage', INDEX_KEY, { time: Date.now(), items: items });
      return items;
    });
    return indexPromise;
  }

  // Everything the palette can offer: { id, kind ('page' | 'setting' | 'action'), title, desc,
  // where, icon, img, href, run }
  function baseEntries() {
    const entries = [];
    document.querySelectorAll('#menu .nav-tile:not(.right) .nav-item a[href]').forEach(function (link) {
      const name = pageName(link.getAttribute('href'));
      const title = (link.title || link.textContent).replace(/\s+/g, ' ').trim();
      if (!title) return;
      entries.push({ id: 'page:' + name, kind: 'page', title: title, desc: DESCRIPTIONS[name] || '', where: 'Page', icon: 'fa fa-' + (PAGE_ICONS[name] || 'circle-o'), href: link.getAttribute('href') });
    });
    document.querySelectorAll('#menu .nav-tile.right .nav-item.util > a').forEach(function (link) {
      const item = link.parentElement;
      const title = (link.title || link.textContent).replace(/\s+/g, ' ').trim();
      if (!title || item.classList.contains('fl-more')) return;
      const glyph = link.querySelector('b, i');
      entries.push({ id: 'action:' + title, kind: 'action', title: title, desc: ACTION_DESCRIPTIONS[[...item.classList].find(function (c) { return ACTION_DESCRIPTIONS[c]; })] || '', where: 'Action', icon: glyph ? glyph.className.replace(/\b(system|green-text|red-text)\b/g, '').trim() : 'fa fa-bolt', run: function () { link.click(); } });
    });
    const theme = document.querySelector('.tp-theme-switch');
    if (theme) {
      const dark = root.classList.contains('Theme--black');
      entries.push({ id: 'action:theme', kind: 'action', title: dark ? 'Switch to light theme' : 'Switch to dark theme', desc: 'For every browser that opens this server', where: 'Action', icon: 'fa ' + (dark ? 'fa-sun-o' : 'fa-moon-o'), run: function () { theme.click(); } });
    }
    const sidebar = document.querySelector('#header .tp-sidebar-toggle');
    if (sidebar && !root.classList.contains('tp-topbar')) {
      entries.push({ id: 'action:sidebar', kind: 'action', title: root.classList.contains('tp-sidebar-collapsed') ? 'Show sidebar' : 'Hide sidebar', desc: '', where: 'Action', icon: 'fa fa-columns', run: function () { sidebar.click(); } });
    }
    entries.push({ id: 'page:AuroraThemeSettings', kind: 'setting', title: 'Aurora Theme settings', desc: DESCRIPTIONS.AuroraThemeSettings, where: 'Settings', icon: 'fa fa-paint-brush', href: '/Settings/AuroraThemeSettings' });
    return entries;
  }

  const PAGE_ICONS = { Dashboard: 'tachometer', Main: 'hdd-o', Shares: 'folder-open', Users: 'users', Settings: 'cog', Plugins: 'puzzle-piece', Docker: 'cubes', VMs: 'desktop', Apps: 'th-large', Stats: 'bar-chart', Tools: 'wrench' };
  const ACTION_DESCRIPTIONS = {
    LockButton: 'Lock or unlock rearranging lists',
    LanguageButton: 'Change the webGUI language',
    gui_search: 'Unraid\'s own page search',
    LogoutButton: 'Sign out of the webGUI',
    TerminalButton: 'Open a shell in a new window',
    BrowseButton: 'Dynamix File Manager',
    FeedbackButton: 'Send feedback to Lime Technology',
    InfoButton: 'System information',
    LogButton: 'Open the system log',
    HelpButton: 'Show or hide this page\'s help',
  };

  // Fuzzy match: every typed character in order. Word starts and runs score higher.
  function match(text, query) {
    if (!query) return { score: 0, marks: [] };
    const lower = text.toLowerCase();
    const direct = lower.indexOf(query);
    if (direct !== -1) {
      const start = direct === 0 || /[\s/(-]/.test(lower[direct - 1]);
      return { score: 100 - direct + (start ? 60 : 0) + (direct === 0 ? 40 : 0), marks: [[direct, direct + query.length]] };
    }
    let score = 0;
    let at = 0;
    const marks = [];
    for (let i = 0; i < query.length; i += 1) {
      const found = lower.indexOf(query[i], at);
      if (found === -1) return null;
      const start = found === 0 || /[\s/(-]/.test(lower[found - 1]);
      score += start ? 8 : found === at ? 4 : 1;
      if (marks.length && marks[marks.length - 1][1] === found) marks[marks.length - 1][1] = found + 1;
      else marks.push([found, found + 1]);
      at = found + 1;
    }
    return { score: score, marks: marks };
  }

  function highlighted(text, marks) {
    const fragment = document.createDocumentFragment();
    let at = 0;
    marks.forEach(function (range) {
      if (range[0] > at) fragment.append(text.slice(at, range[0]));
      fragment.append(element('mark', '', text.slice(range[0], range[1])));
      at = range[1];
    });
    if (at < text.length) fragment.append(text.slice(at));
    return fragment;
  }

  function palette() {
    let backdrop = null;
    let box = null;
    let input = null;
    let list = null;
    let results = [];
    let active = 0;
    let settings = [];
    let lastFocus = null;

    function entries() {
      return baseEntries().concat(settings.map(function (item) {
        const name = pageName(item.href);
        return { id: 'setting:' + item.href, kind: 'setting', title: item.title, desc: DESCRIPTIONS[name] || item.section, where: item.where, icon: item.icon || 'fa fa-cog', img: item.img, href: item.href };
      }));
    }

    function remember(entry) {
      const recent = readJson('localStorage', RECENT_KEY, []).filter(function (id) { return id !== entry.id; });
      recent.unshift(entry.id);
      writeJson('localStorage', RECENT_KEY, recent.slice(0, 6));
    }

    function run(entry, newTab) {
      if (!entry) return;
      remember(entry);
      if (entry.href) {
        if (newTab) window.open(entry.href, '_blank', 'noopener');
        else location.href = entry.href;
        close(false);
        return;
      }
      close(false);
      if (entry.run) setTimeout(entry.run, 0);
    }

    function render() {
      const raw = input.value.trim().toLowerCase();
      const actionsOnly = raw.startsWith('>');
      const query = actionsOnly ? raw.slice(1).trim() : raw;
      const all = entries().filter(function (entry) { return !actionsOnly || entry.kind === 'action'; });
      let groups;
      if (!query) {
        const recentIds = readJson('localStorage', RECENT_KEY, []);
        const recent = actionsOnly ? [] : recentIds.map(function (id) { return all.find(function (entry) { return entry.id === id; }); }).filter(Boolean);
        groups = [
          ['Recent', recent.map(function (entry) { return { entry: entry, marks: [] }; })],
          ['Pages', actionsOnly ? [] : all.filter(function (entry) { return entry.kind === 'page' && !recent.includes(entry); }).map(function (entry) { return { entry: entry, marks: [] }; })],
          ['Actions', all.filter(function (entry) { return entry.kind === 'action' && !recent.includes(entry); }).map(function (entry) { return { entry: entry, marks: [] }; })],
        ];
      } else {
        const scored = [];
        all.forEach(function (entry) {
          const inTitle = match(entry.title, query);
          const inDesc = inTitle ? null : match(entry.desc + ' ' + entry.where, query);
          const best = inTitle || (inDesc && inDesc.score >= 60 ? { score: inDesc.score / 3, marks: [] } : null);
          if (best) scored.push({ entry: entry, marks: inTitle ? inTitle.marks : [], score: best.score + (entry.kind === 'page' ? 6 : 0) });
        });
        scored.sort(function (a, b) { return b.score - a.score; });
        groups = [['Best matches', scored.slice(0, 40)]];
      }

      list.replaceChildren();
      results = [];
      groups.forEach(function (group) {
        if (!group[1].length) return;
        const heading = element('li', 'fl-palette-group', group[0]);
        heading.setAttribute('role', 'presentation');
        list.append(heading);
        group[1].forEach(function (hit) {
          const entry = hit.entry;
          const index = results.length;
          const row = element('li', 'fl-palette-item');
          row.id = 'fl-palette-item-' + index;
          row.setAttribute('role', 'option');
          const glyph = element('span', 'fl-palette-icon');
          if (entry.img) {
            const img = element('img');
            img.src = entry.img;
            img.alt = '';
            glyph.append(img);
          } else {
            glyph.append(icon(entry.icon));
          }
          const text = element('span', 'fl-palette-text');
          const title = element('span', 'fl-palette-title');
          title.append(highlighted(entry.title, hit.marks));
          text.append(title);
          if (entry.desc) text.append(element('span', 'fl-palette-desc', entry.desc));
          row.append(glyph, text, element('span', 'fl-palette-where', entry.where));
          row.addEventListener('mousemove', function () { if (active !== index) select(index); });
          row.addEventListener('click', function (event) { run(entry, event.ctrlKey || event.metaKey); });
          list.append(row);
          results.push(entry);
        });
      });
      if (!results.length) {
        list.append(element('li', 'fl-palette-empty', query ? 'Nothing found for "' + input.value.trim() + '".' : 'Loading…'));
      }
      select(0);
    }

    function select(index) {
      const rows = list.querySelectorAll('.fl-palette-item');
      if (!rows.length) return;
      active = (index + rows.length) % rows.length;
      rows.forEach(function (row, i) {
        row.classList.toggle('fl-active', i === active);
        row.setAttribute('aria-selected', i === active ? 'true' : 'false');
      });
      input.setAttribute('aria-activedescendant', rows[active].id);
      rows[active].scrollIntoView({ block: 'nearest' });
    }

    function onKey(event) {
      if (event.key === 'ArrowDown') { event.preventDefault(); select(active + 1); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); select(active - 1); }
      else if (event.key === 'Enter') { event.preventDefault(); run(results[active], event.ctrlKey || event.metaKey); }
      else if (event.key === 'Escape') { event.preventDefault(); close(true); }
      else if (event.key === 'Tab') { event.preventDefault(); }
    }

    function open(prefill) {
      if (box) { input.focus(); return; }
      lastFocus = document.activeElement;
      backdrop = element('div', 'fl-palette-backdrop');
      backdrop.addEventListener('click', function () { close(true); });
      box = element('div', 'fl-palette');
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', 'Search pages, settings and actions');
      const field = element('div', 'fl-palette-field');
      input = element('input', 'fl-palette-input');
      input.type = 'text';
      input.placeholder = 'Search pages, settings and actions…';
      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-expanded', 'true');
      input.setAttribute('aria-controls', 'fl-palette-list');
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('spellcheck', 'false');
      input.value = prefill || '';
      field.append(icon('fa fa-search'), input, element('kbd', '', 'Esc'));
      list = element('ul', 'fl-palette-list');
      list.id = 'fl-palette-list';
      list.setAttribute('role', 'listbox');
      const foot = element('div', 'fl-palette-foot');
      [['↑↓', 'to move'], ['Enter', 'to open'], ['Ctrl+Enter', 'in a new tab'], ['>', 'actions only']].forEach(function (hint) {
        const span = element('span');
        span.append(element('kbd', '', hint[0]), hint[1]);
        foot.append(span);
      });
      box.append(field, list, foot);
      document.body.append(backdrop, box);
      input.addEventListener('input', render);
      input.addEventListener('keydown', onKey);
      render();
      input.focus();
      settingsIndex().then(function (items) {
        settings = items;
        if (box) render();
      });
    }

    function close(restoreFocus) {
      if (!box) return;
      const leaving = [box, backdrop];
      box = null;
      backdrop = null;
      if (reduceMotion) leaving.forEach(function (node) { node.remove(); });
      else {
        leaving[0].classList.add('fl-closing');
        leaving[1].style.transition = 'opacity 120ms linear';
        leaving[1].style.opacity = '0';
        setTimeout(function () { leaving.forEach(function (node) { node.remove(); }); }, 170);
      }
      if (restoreFocus && lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.addEventListener('keydown', function (event) {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && (event.key === 'k' || event.key === 'K')) {
        event.preventDefault();
        if (box) close(true);
        else open('');
      }
    });

    // Warm the index in idle time, so the first search already knows every setting.
    const idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 1500); };
    idle(function () { settingsIndex(); });

    return open;
  }

  // Launchers for the palette: a "Find a setting" box above the sidebar menu, and a search
  // button in the top bar when the menu runs across the top.
  function paletteLaunchers(open) {
    const menu = document.getElementById('menu');
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || '');
    const shortcut = isMac ? '⌘K' : 'Ctrl+K';
    if (menu && !menu.querySelector('.fl-search-launch')) {
      const launch = element('button', 'fl-search-launch fl-bare');
      launch.type = 'button';
      launch.append(icon('fa fa-search'), element('span', '', 'Find a setting'), element('kbd', '', shortcut));
      launch.addEventListener('click', function () { open(''); });
      const tile = menu.querySelector('.nav-tile:not(.right)');
      if (tile) tile.before(launch);
    }
    const header = document.getElementById('header');
    if (header && !header.querySelector('.fl-search-button')) {
      const button = element('button', 'fl-search-button fl-bare');
      button.type = 'button';
      button.title = 'Search (' + shortcut + ')';
      button.setAttribute('aria-label', 'Search pages, settings and actions');
      button.append(icon('fa fa-search'), element('span', '', 'Search'), element('kbd', '', shortcut));
      button.addEventListener('click', function () { open(''); });
      const place = function () {
        const top = root.classList.contains('tp-topbar');
        button.hidden = !top;
        if (top && !button.isConnected) {
          const anchor = header.querySelector('#UserProfile, unraid-user-profile');
          if (anchor) anchor.before(button);
          else header.append(button);
        }
      };
      place();
      new MutationObserver(place).observe(root, { attributes: true, attributeFilter: ['class'] });
    }
  }

  // ======================================================================
  // Settings and Tools: a description line on each card.
  // ======================================================================
  // Settings and Tools sub-pages: their forms become cards of rows (fluent.css).
  function formCards() {
    if (path.length < 2 || !/^(Settings|Tools)$/.test(path[0])) return;
    root.classList.add('fl-form-cards');
    document.querySelectorAll('#displaybox form dl').forEach(function (list) {
      const names = [...list.children].filter(function (child) { return child.matches('dt'); });
      if (!names.length) return;
      names.forEach(function (name) {
        if (!name.textContent.replace(/\u00a0/g, ' ').trim()) {
          name.classList.add('fl-blank');
          return;
        }
        // Windows labels its settings without a trailing colon.
        const walker = document.createTreeWalker(name, NodeFilter.SHOW_TEXT);
        let last = null;
        while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) last = walker.currentNode;
        if (last) last.nodeValue = last.nodeValue.replace(/:\s*$/, '');
      });
      if (names.every(function (name) { return name.classList.contains('fl-blank'); })) list.classList.add('fl-actions');
    });
  }

  function panelDescriptions() {
    if (path.length !== 1 || !/^(Settings|Tools)$/.test(path[0])) return;
    document.querySelectorAll('#displaybox .Panels .Panel > a[href]').forEach(function (link) {
      if (link.querySelector('.fl-panel-desc')) return;
      const text = DESCRIPTIONS[pageName(link.getAttribute('href'))];
      if (!text) return;
      const desc = element('span', 'fl-panel-desc', text);
      const name = link.querySelector('.PanelText');
      if (name) name.after(desc);
      else link.append(desc);
      link.title = text;
    });
  }

  // ======================================================================
  // Sub-pages: the title becomes a breadcrumb back to the tab ("Settings › Display Settings").
  // ======================================================================
  function breadcrumb() {
    const heading = document.querySelector('#displaybox .tp-heading');
    if (!heading || path.length < 2 || heading.querySelector('.fl-crumb')) return;
    const eyebrow = heading.querySelector('.tp-eyebrow');
    const title = heading.querySelector('h1');
    const tab = document.querySelector('#menu .nav-item.active a[href]');
    if (!eyebrow || !title || !tab || eyebrow.textContent.trim() !== tab.textContent.trim()) return;
    const crumb = element('h1', 'fl-crumb');
    const back = element('a', '', eyebrow.textContent.trim());
    back.href = tab.getAttribute('href');
    const sep = element('span', 'fl-crumb-sep');
    sep.append(icon('fa fa-chevron-right'));
    crumb.append(back, sep, element('span', '', title.textContent.trim()));
    title.replaceWith(crumb);
    eyebrow.remove();
  }

  // ======================================================================
  // Motion: the order cards rise in (CSS does the animation), and the pointer light.
  // ======================================================================
  function entranceOrder() {
    let i = 0;
    document.querySelectorAll('#displaybox > .tp-heading, #displaybox > .tp-summary, table.dashboard > tbody, #displaybox .Panels > .Panel, #displaybox .TableContainer, #displaybox > form').forEach(function (node) {
      const rect = node.getBoundingClientRect();
      // Only what is on screen takes part; the rest is simply there when scrolled to.
      if (rect.top > window.innerHeight) return;
      node.style.setProperty('--fl-i', Math.min(i, 16));
      i += 1;
    });
    setTimeout(function () { root.classList.remove('fl-enter'); }, 1400);
  }

  function pointerLight() {
    if (reduceMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let frame = 0;
    let target = null;
    let x = 0;
    let y = 0;
    document.addEventListener('pointermove', function (event) {
      const card = event.target.closest && event.target.closest('.Panel > a, table.dashboard > tbody, .tp-summary, .fl-reveal');
      if (target && target !== card) {
        target.style.removeProperty('--fl-x');
        target.style.removeProperty('--fl-y');
      }
      target = card;
      if (!card) return;
      x = event.clientX;
      y = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(function () {
        frame = 0;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        target.style.setProperty('--fl-x', (x - rect.left) + 'px');
        target.style.setProperty('--fl-y', (y - rect.top) + 'px');
      });
    }, { passive: true });
  }

  function start() {
    let open = function () {};
    [menuGroups, navPill, function () { open = palette(); }, function () { paletteLaunchers(open); }, function () { quickActions(open); },
      formCards, panelDescriptions, breadcrumb, entranceOrder, pointerLight].forEach(function (part) {
      // One failing part must not stop the others or the page's own scripts.
      try { part(); } catch (error) { console.error('Aurora Theme (Fluent):', error); }
    });
  }

  // After enhance.js (both are deferred, this one later), so its heading and cards are in place.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
