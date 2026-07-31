/**
 * Boxed Design System — Interactive behaviors
 * Progressive enhancement. Works without build tools.
 *
 * Public API: window.BoxedDS
 *   .theme.set('dark'|'light'|'system')
 *   .theme.toggle()
 *   .toast({ title, description?, variant?, duration? })
 *   .modal.open(id) / .modal.close(id)
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'bx-theme';
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ */
  /* Theme                                                              */
  /* ------------------------------------------------------------------ */
  const Theme = {
    getSystem() {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    },

    resolve(preference) {
      if (preference === 'system' || !preference) return this.getSystem();
      return preference === 'light' ? 'light' : 'dark';
    },

    apply(preference) {
      const pref = preference || localStorage.getItem(STORAGE_KEY) || 'dark';
      const resolved = this.resolve(pref);
      document.documentElement.setAttribute('data-theme', resolved);
      document.documentElement.setAttribute('data-theme-pref', pref);
      localStorage.setItem(STORAGE_KEY, pref);
      this._syncToggles(pref, resolved);
      return resolved;
    },

    set(preference) {
      return this.apply(preference);
    },

    toggle() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      return this.apply(current === 'dark' ? 'light' : 'dark');
    },

    _syncToggles(pref, resolved) {
      document.querySelectorAll('[data-bx-theme-toggle]').forEach((btn) => {
        btn.setAttribute('aria-pressed', resolved === 'dark' ? 'true' : 'false');
        const label = btn.querySelector('[data-bx-theme-label]');
        if (label) label.textContent = resolved === 'dark' ? 'Dark' : 'Light';
      });
      document.querySelectorAll('[data-bx-theme-select]').forEach((sel) => {
        if (sel.value !== pref) sel.value = pref;
      });
    },

    init() {
      this.apply(localStorage.getItem(STORAGE_KEY) || 'dark');

      document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-bx-theme-toggle]');
        if (btn) {
          e.preventDefault();
          this.toggle();
        }
      });

      document.addEventListener('change', (e) => {
        const sel = e.target.closest('[data-bx-theme-select]');
        if (sel) this.set(sel.value);
      });

      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
        if ((localStorage.getItem(STORAGE_KEY) || 'system') === 'system') {
          this.apply('system');
        }
      });
    },
  };

  /* ------------------------------------------------------------------ */
  /* Toast                                                              */
  /* ------------------------------------------------------------------ */
  const Toast = {
    _region: null,

    _ensureRegion() {
      if (this._region) return this._region;
      let region = document.querySelector('.bx-toast-region');
      if (!region) {
        region = document.createElement('div');
        region.className = 'bx-toast-region';
        region.setAttribute('aria-live', 'polite');
        region.setAttribute('aria-relevant', 'additions');
        document.body.appendChild(region);
      }
      this._region = region;
      return region;
    },

    show({ title = '', description = '', variant = 'info', duration = 4000 } = {}) {
      const region = this._ensureRegion();
      const el = document.createElement('div');
      el.className = `bx-toast bx-toast--${variant}`;
      el.setAttribute('role', variant === 'error' ? 'alert' : 'status');

      const icons = {
        success: '<path d="M20 6L9 17l-5-5"/>',
        error: '<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>',
        warning: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h16.9a2 2 0 001.7-3L12.7 3.9a2 2 0 00-3.4 0z"/>',
        info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
      };

      el.innerHTML = `
        <svg class="bx-toast__icon bx-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[variant] || icons.info}</svg>
        <div class="bx-toast__body">
          ${title ? `<div class="bx-toast__title">${escapeHtml(title)}</div>` : ''}
          ${description ? `<div class="bx-toast__desc">${escapeHtml(description)}</div>` : ''}
        </div>
        <button type="button" class="bx-alert__close" aria-label="Dismiss">
          <svg class="bx-icon bx-icon--sm" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      `;

      const dismiss = () => {
        el.classList.add('bx-toast--leaving');
        const done = () => el.remove();
        if (REDUCED_MOTION) done();
        else el.addEventListener('animationend', done, { once: true });
      };

      el.querySelector('.bx-alert__close').addEventListener('click', dismiss);
      region.appendChild(el);

      if (duration > 0) {
        setTimeout(dismiss, duration);
      }

      return { dismiss, el };
    },
  };

  /* ------------------------------------------------------------------ */
  /* Modal                                                              */
  /* ------------------------------------------------------------------ */
  const Modal = {
    _stack: [],
    _lastFocus: null,

    open(id) {
      const modal = typeof id === 'string' ? document.getElementById(id) : id;
      if (!modal) return;

      let backdrop = document.querySelector(`[data-bx-modal-backdrop="${modal.id}"]`);
      if (!backdrop && modal.previousElementSibling?.classList?.contains('bx-modal-backdrop')) {
        backdrop = modal.previousElementSibling;
      }

      this._lastFocus = document.activeElement;
      modal.classList.add('is-open');
      if (backdrop) backdrop.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      this._stack.push(modal.id);

      const focusable = modal.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) focusable.focus();
    },

    close(id) {
      const modalId = id || this._stack[this._stack.length - 1];
      if (!modalId) return;

      const modal = document.getElementById(modalId);
      if (!modal) return;

      const backdrop = document.querySelector(`[data-bx-modal-backdrop="${modal.id}"]`);
      modal.classList.remove('is-open');
      if (backdrop) backdrop.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');

      this._stack = this._stack.filter((x) => x !== modalId);
      if (this._stack.length === 0) {
        document.body.style.overflow = '';
      }

      if (this._lastFocus && typeof this._lastFocus.focus === 'function') {
        this._lastFocus.focus();
      }
    },

    init() {
      document.addEventListener('click', (e) => {
        const openBtn = e.target.closest('[data-bx-modal-open]');
        if (openBtn) {
          e.preventDefault();
          this.open(openBtn.getAttribute('data-bx-modal-open'));
          return;
        }

        const closeBtn = e.target.closest('[data-bx-modal-close]');
        if (closeBtn) {
          e.preventDefault();
          const target = closeBtn.getAttribute('data-bx-modal-close');
          this.close(target || undefined);
          return;
        }

        if (e.target.classList.contains('bx-modal-backdrop') && e.target.classList.contains('is-open')) {
          const id = e.target.getAttribute('data-bx-modal-backdrop');
          if (id) this.close(id);
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this._stack.length) {
          this.close();
        }
      });
    },
  };

  /* ------------------------------------------------------------------ */
  /* Dropdown                                                           */
  /* ------------------------------------------------------------------ */
  const Dropdown = {
    closeAll(except) {
      document.querySelectorAll('.bx-dropdown.is-open').forEach((d) => {
        if (d !== except) {
          d.classList.remove('is-open');
          const trigger = d.querySelector('[data-bx-dropdown-trigger]');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        }
      });
    },

    init() {
      document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-bx-dropdown-trigger]');
        if (trigger) {
          e.preventDefault();
          const dropdown = trigger.closest('.bx-dropdown');
          if (!dropdown) return;
          const isOpen = dropdown.classList.contains('is-open');
          this.closeAll();
          if (!isOpen) {
            dropdown.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
          }
          return;
        }

        if (!e.target.closest('.bx-dropdown')) {
          this.closeAll();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.closeAll();
      });
    },
  };

  /* ------------------------------------------------------------------ */
  /* Tabs                                                               */
  /* ------------------------------------------------------------------ */
  const Tabs = {
    init() {
      document.querySelectorAll('[data-bx-tabs]').forEach((root) => {
        const tabs = [...root.querySelectorAll('[role="tab"]')];
        const panels = [...root.querySelectorAll('[role="tabpanel"]')];

        const activate = (tab) => {
          tabs.forEach((t) => {
            const selected = t === tab;
            t.setAttribute('aria-selected', selected ? 'true' : 'false');
            t.tabIndex = selected ? 0 : -1;
          });
          panels.forEach((p) => {
            const show = p.id === tab.getAttribute('aria-controls');
            p.hidden = !show;
          });
        };

        tabs.forEach((tab) => {
          tab.addEventListener('click', () => activate(tab));
          tab.addEventListener('keydown', (e) => {
            const i = tabs.indexOf(tab);
            let next = null;
            if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
            if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
            if (e.key === 'Home') next = tabs[0];
            if (e.key === 'End') next = tabs[tabs.length - 1];
            if (next) {
              e.preventDefault();
              next.focus();
              activate(next);
            }
          });
        });
      });
    },
  };

  /* ------------------------------------------------------------------ */
  /* Accordion                                                          */
  /* ------------------------------------------------------------------ */
  const Accordion = {
    init() {
      document.querySelectorAll('[data-bx-accordion]').forEach((root) => {
        const multi = root.hasAttribute('data-bx-accordion-multi');

        root.querySelectorAll('.bx-accordion__trigger').forEach((trigger) => {
          trigger.addEventListener('click', () => {
            const item = trigger.closest('.bx-accordion__item');
            if (!item) return;
            const open = item.classList.contains('is-open');

            if (!multi) {
              root.querySelectorAll('.bx-accordion__item.is-open').forEach((i) => {
                if (i !== item) {
                  i.classList.remove('is-open');
                  const t = i.querySelector('.bx-accordion__trigger');
                  if (t) t.setAttribute('aria-expanded', 'false');
                }
              });
            }

            item.classList.toggle('is-open', !open);
            trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
          });
        });
      });
    },
  };

  /* ------------------------------------------------------------------ */
  /* Copy to clipboard                                                  */
  /* ------------------------------------------------------------------ */
  const Copy = {
    init() {
      document.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-bx-copy]');
        if (!btn) return;
        e.preventDefault();
        const target = btn.getAttribute('data-bx-copy');
        let text = btn.getAttribute('data-bx-copy-text') || '';
        if (target) {
          const el = document.querySelector(target);
          if (el) text = el.textContent || el.value || '';
        }
        try {
          await navigator.clipboard.writeText(text.trim());
          const original = btn.textContent;
          btn.textContent = 'Copied';
          Toast.show({ title: 'Copied to clipboard', variant: 'success', duration: 2000 });
          setTimeout(() => {
            if (btn.textContent === 'Copied') btn.textContent = original;
          }, 1500);
        } catch {
          Toast.show({ title: 'Copy failed', variant: 'error' });
        }
      });
    },
  };

  /* ------------------------------------------------------------------ */
  /* Alert dismiss                                                      */
  /* ------------------------------------------------------------------ */
  const Alerts = {
    init() {
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-bx-alert-dismiss]');
        if (!btn) return;
        const alert = btn.closest('.bx-alert');
        if (alert) {
          alert.style.opacity = '0';
          alert.style.transition = `opacity ${getComputedStyle(document.documentElement).getPropertyValue('--bx-duration-fast') || '120ms'}`;
          setTimeout(() => alert.remove(), 150);
        }
      });
    },
  };

  /* ------------------------------------------------------------------ */
  /* Docs: sidebar, active section, mobile nav                          */
  /* ------------------------------------------------------------------ */
  const DocsNav = {
    init() {
      const sidebar = document.querySelector('[data-ds-sidebar]');
      const overlay = document.querySelector('[data-ds-overlay]');
      const toggle = document.querySelector('[data-ds-nav-toggle]');
      if (!sidebar) return;

      const open = () => {
        sidebar.classList.add('is-open');
        if (overlay) overlay.classList.add('is-open');
        if (toggle) toggle.setAttribute('aria-expanded', 'true');
      };
      const close = () => {
        sidebar.classList.remove('is-open');
        if (overlay) overlay.classList.remove('is-open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      };

      if (toggle) {
        toggle.addEventListener('click', () => {
          sidebar.classList.contains('is-open') ? close() : open();
        });
      }
      if (overlay) overlay.addEventListener('click', close);

      sidebar.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', () => {
          if (window.innerWidth < 1024) close();
        });
      });

      /* Active section highlighting */
      const links = [...sidebar.querySelectorAll('a[href^="#"]')];
      const sections = links
        .map((l) => document.querySelector(l.getAttribute('href')))
        .filter(Boolean);

      if (sections.length && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const id = entry.target.id;
              links.forEach((l) => {
                l.classList.toggle('is-active', l.getAttribute('href') === `#${id}`);
              });
            });
          },
          { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
        );
        sections.forEach((s) => observer.observe(s));
      }
    },
  };

  /* ------------------------------------------------------------------ */
  /* Form validation demo                                               */
  /* ------------------------------------------------------------------ */
  const Forms = {
    init() {
      document.querySelectorAll('[data-bx-form-validate]').forEach((form) => {
        form.setAttribute('novalidate', '');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          let valid = true;
          form.querySelectorAll('[required]').forEach((input) => {
            const field = input.closest('.bx-field');
            const empty = !input.value.trim();
            if (field) {
              field.classList.toggle('bx-field--error', empty);
              const err = field.querySelector('.bx-field__error');
              if (err) err.hidden = !empty;
            }
            if (empty) valid = false;
          });
          if (valid) {
            Toast.show({
              title: 'Form submitted',
              description: 'Validation passed. Hook this to your API.',
              variant: 'success',
            });
            form.reset();
            form.querySelectorAll('.bx-field--error').forEach((f) => f.classList.remove('bx-field--error'));
          } else {
            Toast.show({ title: 'Check required fields', variant: 'error' });
          }
        });
      });
    },
  };

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                               */
  /* ------------------------------------------------------------------ */
  function init() {
    Theme.init();
    Modal.init();
    Dropdown.init();
    Tabs.init();
    Accordion.init();
    Copy.init();
    Alerts.init();
    DocsNav.init();
    Forms.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.BoxedDS = {
    theme: Theme,
    toast: (opts) => Toast.show(opts),
    modal: Modal,
    version: '1.0.0',
  };
})(typeof window !== 'undefined' ? window : globalThis);
