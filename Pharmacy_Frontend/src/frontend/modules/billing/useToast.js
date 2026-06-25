import { useState, useCallback } from 'react';

/**
 * Lightweight toast notification hook.
 * Replaces all blocking alert() / window.confirm() calls in the billing module.
 *
 * Usage:
 *   const { toasts, toast, confirm } = useToast();
 *   toast.success('Invoice saved!');
 *   toast.error('Stock sync failed!');
 *   const ok = await confirm('Delete this draft?');
 */

let _idCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /**
   * Show a toast message.
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {string} message
   * @param {number} [duration=4000] ms before auto-dismiss (0 = sticky)
   */
  const showToast = useCallback((type, message, duration = 4000) => {
    const id = ++_idCounter;
    setToasts(prev => [{ id, type, message }, ...prev]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const toast = {
    success: (msg, dur) => showToast('success', msg, dur),
    error:   (msg, dur) => showToast('error',   msg, dur ?? 0), // errors are sticky
    warning: (msg, dur) => showToast('warning', msg, dur),
    info:    (msg, dur) => showToast('info',    msg, dur),
  };

  /**
   * Non-blocking confirm dialog using a Promise.
   * Resolves to true (OK) or false (Cancel).
   */
  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      const id = ++_idCounter;
      setToasts(prev => [{ id, type: 'confirm', message, resolve }, ...prev]);
    });
  }, []);

  const resolveConfirm = useCallback((id, value) => {
    setToasts(prev => {
      const item = prev.find(t => t.id === id);
      if (item?.resolve) item.resolve(value);
      return prev.filter(t => t.id !== id);
    });
  }, []);

  return { toasts, toast, confirm, dismiss, resolveConfirm };
}
