// Workshop House - Keyboard Navigation & Accessibility Shortcuts
// WCAG 2.1.4: Shortcuts use modifiers (Alt+Shift) and can be toggled in User Preferences

(function () {
  // Check if shortcuts are enabled for this user (read data attribute or fallback)
  const shortcutsEnabled = document.body.dataset.shortcutsEnabled !== 'false';

  if (!shortcutsEnabled) {
    return;
  }

  document.addEventListener('keydown', function (e) {
    // Esc closes any open dialog
    if (e.key === 'Escape') {
      const openDialog = document.querySelector('dialog[open]');
      if (openDialog && typeof openDialog.close === 'function') {
        openDialog.close();
      }
      return;
    }

    // Require Alt + Shift modifiers
    if (!e.altKey || !e.shiftKey) {
      return;
    }

    const key = e.key.toUpperCase();

    switch (key) {
      case 'S': // Alt+Shift+S -> Sessions
        e.preventDefault();
        window.location.href = '/sessions';
        break;

      case 'M': // Alt+Shift+M -> My Sessions
        e.preventDefault();
        window.location.href = '/my-sessions';
        break;

      case 'D': // Alt+Shift+D -> Dashboard
        e.preventDefault();
        window.location.href = '/dashboard';
        break;

      case 'A': // Alt+Shift+A -> Trainer Attendance / Sessions
        e.preventDefault();
        window.location.href = '/trainer/sessions';
        break;

      case 'K': // Alt+Shift+K -> Focus Check-in Code Field
        e.preventDefault();
        const codeInput = document.getElementById('checkin-code-input') || document.getElementById('code');
        if (codeInput) {
          codeInput.focus();
          codeInput.select();
        }
        break;

      case 'H': // Alt+Shift+H -> Open Shortcuts Help Dialog
        e.preventDefault();
        const helpDialog = document.getElementById('shortcuts-dialog');
        if (helpDialog && typeof helpDialog.showModal === 'function') {
          if (helpDialog.hasAttribute('open')) {
            helpDialog.close();
          } else {
            helpDialog.showModal();
          }
        }
        break;
    }
  });
})();
