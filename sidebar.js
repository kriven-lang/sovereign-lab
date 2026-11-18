(function () {
  'use strict';

  const sidebar = document.getElementById('workspace-sidebar');
  const toggle = document.getElementById('sidebar-toggle');
  const preference = 'sovereign-lab.sidebar-collapsed';

  function setCollapsed(collapsed) {
    sidebar.hidden = collapsed;
    const label = collapsed ? 'Show navigation' : 'Hide navigation';
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
  }

  let collapsed = false;
  try {
    collapsed = localStorage.getItem(preference) === 'true';
  } catch {
    // The toggle still works in this tab when storage is unavailable.
  }
  setCollapsed(collapsed);
  toggle.hidden = false;

  toggle.addEventListener('click', () => {
    const next = !sidebar.hidden;
    setCollapsed(next);
    try {
      localStorage.setItem(preference, String(next));
    } catch {
      // The current layout is already updated.
    }
  });
})();
