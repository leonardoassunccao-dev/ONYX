export const applyTheme = (theme: 'gold' | 'silver' | 'emerald') => {
  try {
    const root = document.documentElement;
    if (theme === 'silver') {
      root.style.setProperty('--accent-color', '#D1D5DB'); // Zinc 300
      root.style.setProperty('--accent-rgb', '209, 213, 219');
    } else if (theme === 'emerald') {
      root.style.setProperty('--accent-color', '#34D399'); // Emerald 400
      root.style.setProperty('--accent-rgb', '52, 211, 153');
    } else {
      // Gold (Default)
      root.style.setProperty('--accent-color', '#D4AF37');
      root.style.setProperty('--accent-rgb', '212, 175, 55');
    }
    localStorage.setItem('onyx_theme', theme);
  } catch (e) {
    console.warn("Theme application failed (Storage restricted):", e);
  }
};