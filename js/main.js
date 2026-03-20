// Tab navigation
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const tabs = document.querySelectorAll('.tab-content');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.dataset.tab;

            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show target tab
            tabs.forEach(tab => tab.classList.remove('active'));
            document.getElementById(`tab-${targetTab}`).classList.add('active');

            // Reset body classes when leaving roisin tab
            if (targetTab !== 'roisin') {
                document.body.className = '';
            }
        });
    });

    // Handle placeholder visibility based on image load
    setupImagePlaceholder('profile-photo', 'photo-placeholder-mikael');
    setupImagePlaceholder('couple-photo', 'photo-placeholder-couple');
});

function setupImagePlaceholder(imgId, placeholderId) {
    const img = document.getElementById(imgId);
    const placeholder = document.getElementById(placeholderId);

    if (!img || !placeholder) return;

    img.addEventListener('load', () => {
        img.style.display = 'block';
        placeholder.style.display = 'none';
    });

    img.addEventListener('error', () => {
        img.style.display = 'none';
        placeholder.style.display = 'flex';
    });

    // Trigger check for already-cached images
    if (img.complete && img.naturalWidth > 0) {
        img.style.display = 'block';
        placeholder.style.display = 'none';
    } else {
        img.style.display = 'none';
        placeholder.style.display = 'flex';
    }
}
