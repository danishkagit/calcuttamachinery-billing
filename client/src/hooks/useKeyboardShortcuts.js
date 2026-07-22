import { useEffect, useState, useCallback } from 'react';

const useKeyboardShortcuts = (navigate) => {
  const [showHelp, setShowHelp] = useState(false);

  const closeHelp = useCallback(() => setShowHelp(false), []);

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'F1') {
        e.preventDefault();
        setShowHelp((p) => !p);
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        navigate('/invoices/create');
        return;
      }

      if (e.key === 'F3') {
        e.preventDefault();
        navigate('/parties');
        return;
      }

      if (e.key === 'F4') {
        e.preventDefault();
        navigate('/products');
        return;
      }

      if (e.key === 'F5') {
        e.preventDefault();
        navigate('/invoices');
        return;
      }

      if (e.key === 'Escape') {
        setShowHelp(false);
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'i':
          case 'n':
            e.preventDefault();
            navigate('/invoices/create');
            break;
          case 'd':
            e.preventDefault();
            navigate('/');
            break;
          case 'p':
            e.preventDefault();
            navigate('/parties');
            break;
          case 'b':
            e.preventDefault();
            navigate('/products');
            break;
          case 's':
            e.preventDefault();
            navigate('/invoices');
            break;
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate]);

  return { showHelp, closeHelp };
};

export default useKeyboardShortcuts;
