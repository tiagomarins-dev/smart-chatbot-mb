<?php
// Footer partial for Smart-ChatBox pages
?>
    </div> <!-- /.main-container -->
    <!-- Bootstrap JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        function initTheme() {
            const savedTheme = localStorage.getItem('smartchatbox-theme') || 'light';
            document.documentElement.setAttribute('data-bs-theme', savedTheme);
            const themeIcon = document.getElementById('theme-icon');
            if (!themeIcon) return;
            if (savedTheme === 'dark') {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            } else {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            }
        }
        function toggleTheme() {
            const current = document.documentElement.getAttribute('data-bs-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('smartchatbox-theme', newTheme);
            const themeIcon = document.getElementById('theme-icon');
            if (!themeIcon) return;
            if (newTheme === 'dark') {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            } else {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            }
        }
        initTheme();
        const switchBtn = document.getElementById('theme-switch');
        if (switchBtn) switchBtn.addEventListener('click', toggleTheme);
    });
    </script>
</body>
</html>