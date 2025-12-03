// Reset UI Settings Script
// Open browser console (F12) and paste this to reset all UI customizations

// Clear column widths
Object.keys(localStorage).forEach(key => {
    if (key.startsWith('inventory-column-widths-') || key.startsWith('inventory-header-height-')) {
        localStorage.removeItem(key);
        console.log('Removed:', key);
    }
});

console.log('UI settings reset! Refresh the page to see changes.');
