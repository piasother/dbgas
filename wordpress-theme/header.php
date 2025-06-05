<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1">
    <title><?php wp_title('|', true, 'right'); ?><?php bloginfo('name'); ?></title>
    <meta name="description" content="Leading LPG supplier in Zimbabwe. Professional gas cylinder refills, commercial installations, and accessories. 2-hour delivery, ZERA licensed. Order online now.">
    
    <!-- Open Graph tags -->
    <meta property="og:title" content="DB Gas - Fueling Zimbabwe Safely">
    <meta property="og:description" content="Leading LPG supplier in Zimbabwe with 2-hour delivery, professional installations, and ZERA-compliant safety standards.">
    <meta property="og:type" content="website">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
    <!-- Cart Indicator -->
    <?php if (function_exists('WC')) : ?>
    <div class="cart-indicator" onclick="window.location.href='<?php echo wc_get_cart_url(); ?>'">
        <i class="fas fa-shopping-cart"></i>
        <span><?php echo WC()->cart->get_cart_contents_count(); ?></span> Items - 
        <?php echo WC()->cart->get_cart_total(); ?>
    </div>
    <?php endif; ?>

    <!-- Header -->
    <header class="site-header">
        <div class="container">
            <div class="header-content">
                <a href="<?php echo home_url(); ?>" class="logo">
                    <i class="fas fa-fire"></i>
                    DB Gas
                </a>

                <!-- Desktop Navigation -->
                <nav class="main-nav">
                    <ul>
                        <li><a href="#hero-section" onclick="scrollToSection('hero-section')">Home</a></li>
                        <li><a href="#about" onclick="scrollToSection('about')">About Us</a></li>
                        <li><a href="#services" onclick="scrollToSection('services')">Services</a></li>
                        <li><a href="#shop-section" onclick="scrollToSection('shop-section')">Shop Online</a></li>
                        <li><a href="#commercial-section" onclick="scrollToSection('commercial-section')">Commercial</a></li>
                        <li><a href="#accessories-section" onclick="scrollToSection('accessories-section')">Accessories</a></li>
                        <li><a href="#safety" onclick="scrollToSection('safety')">Safety</a></li>
                        <li><a href="#contact" onclick="scrollToSection('contact')">Contact</a></li>
                    </ul>
                </nav>

                <!-- Mobile menu button -->
                <div class="mobile-menu-toggle" style="display: none;">
                    <button onclick="toggleMobileMenu()" style="background: none; border: none; color: var(--primary-color); font-size: 1.5rem;">
                        <i class="fas fa-bars" id="mobile-menu-icon"></i>
                    </button>
                </div>
            </div>

            <!-- Mobile Navigation -->
            <nav class="mobile-nav" id="mobile-nav" style="display: none;">
                <ul style="list-style: none; padding: 1rem 0; background: var(--white); border-top: 1px solid var(--border-color);">
                    <li><a href="#hero-section" onclick="scrollToSection('hero-section'); toggleMobileMenu();" style="display: block; padding: 0.75rem 1rem; color: var(--primary-color); text-decoration: none;">Home</a></li>
                    <li><a href="#about" onclick="scrollToSection('about'); toggleMobileMenu();" style="display: block; padding: 0.75rem 1rem; color: var(--primary-color); text-decoration: none;">About Us</a></li>
                    <li><a href="#services" onclick="scrollToSection('services'); toggleMobileMenu();" style="display: block; padding: 0.75rem 1rem; color: var(--primary-color); text-decoration: none;">Services</a></li>
                    <li><a href="#shop-section" onclick="scrollToSection('shop-section'); toggleMobileMenu();" style="display: block; padding: 0.75rem 1rem; color: var(--primary-color); text-decoration: none;">Shop Online</a></li>
                    <li><a href="#commercial-section" onclick="scrollToSection('commercial-section'); toggleMobileMenu();" style="display: block; padding: 0.75rem 1rem; color: var(--primary-color); text-decoration: none;">Commercial</a></li>
                    <li><a href="#accessories-section" onclick="scrollToSection('accessories-section'); toggleMobileMenu();" style="display: block; padding: 0.75rem 1rem; color: var(--primary-color); text-decoration: none;">Accessories</a></li>
                    <li><a href="#safety" onclick="scrollToSection('safety'); toggleMobileMenu();" style="display: block; padding: 0.75rem 1rem; color: var(--primary-color); text-decoration: none;">Safety</a></li>
                    <li><a href="#contact" onclick="scrollToSection('contact'); toggleMobileMenu();" style="display: block; padding: 0.75rem 1rem; color: var(--primary-color); text-decoration: none;">Contact</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <!-- WhatsApp Float Button -->
    <a href="https://wa.me/263771234567" target="_blank" rel="noopener noreferrer" class="whatsapp-float">
        <i class="fab fa-whatsapp"></i>
        WhatsApp Us
    </a>

    <script>
        function scrollToSection(sectionId) {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }

        function toggleMobileMenu() {
            const mobileNav = document.getElementById('mobile-nav');
            const icon = document.getElementById('mobile-menu-icon');
            
            if (mobileNav.style.display === 'none' || mobileNav.style.display === '') {
                mobileNav.style.display = 'block';
                icon.className = 'fas fa-times';
            } else {
                mobileNav.style.display = 'none';
                icon.className = 'fas fa-bars';
            }
        }

        // Show mobile menu toggle on small screens
        function checkScreenSize() {
            const mobileToggle = document.querySelector('.mobile-menu-toggle');
            const mainNav = document.querySelector('.main-nav');
            
            if (window.innerWidth <= 768) {
                mobileToggle.style.display = 'block';
                mainNav.style.display = 'none';
            } else {
                mobileToggle.style.display = 'none';
                mainNav.style.display = 'block';
                document.getElementById('mobile-nav').style.display = 'none';
                document.getElementById('mobile-menu-icon').className = 'fas fa-bars';
            }
        }

        // Check on load and resize
        window.addEventListener('load', checkScreenSize);
        window.addEventListener('resize', checkScreenSize);
    </script>