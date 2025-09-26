document.addEventListener('DOMContentLoaded', () => {
    // A more robust way that also handles dynamically loaded content
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                replaceTextInSubtree(document.body);
            }
        });
    });

    const replaceTextInSubtree = (parentNode) => {
        // Replace in text nodes
        const walker = document.createTreeWalker(parentNode, NodeFilter.SHOW_TEXT);
        let node;
        while (node = walker.nextNode()) {
            if (node.nodeValue.includes('ERPNEXT')) {
                node.nodeValue = node.nodeValue.replace(/ERPNEXT/g, 'RavanOS');
            }
            if (node.nodeValue.includes('Frappe')) {
                node.nodeValue = node.nodeValue.replace(/Frappe/g, 'Ravan');
            }
        }

        // Also check for specific elements that might have the text, like the title
        if (document.title.includes('ERPNEXT')) {
            document.title = document.title.replace(/ERPNEXT/g, 'RavanOS');
        }
        if (document.title.includes('Frappe')) {
            document.title = document.title.replace(/Frappe/g, 'Ravan');
        }
    };

    // Initial replacement
    setTimeout(() => {
        replaceTextInSubtree(document.body);
    }, 500); // Small delay to let initial render finish

    // Observe changes in the DOM
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}); 