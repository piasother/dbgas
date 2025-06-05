jQuery(document).ready(function($) {
    // Smooth scrolling for anchor links
    $('a[href^="#"]').on('click', function(event) {
        var target = $(this.getAttribute('href'));
        if(target.length) {
            event.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 80
            }, 1000);
        }
    });

    // Mobile menu toggle
    window.scrollToSection = function(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    window.toggleMobileMenu = function() {
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

    // Header scroll effect
    $(window).scroll(function() {
        var scroll = $(window).scrollTop();
        if (scroll >= 50) {
            $('.site-header').addClass('scrolled');
        } else {
            $('.site-header').removeClass('scrolled');
        }
    });

    // Animate stats on scroll
    function animateStats() {
        $('.stat-number').each(function() {
            var $this = $(this);
            var countTo = $this.text();
            
            if (!$this.hasClass('animated')) {
                $this.addClass('animated');
                $({ countNum: 0 }).animate({
                    countNum: countTo
                }, {
                    duration: 2000,
                    easing: 'linear',
                    step: function() {
                        $this.text(Math.floor(this.countNum));
                    },
                    complete: function() {
                        $this.text(countTo);
                    }
                });
            }
        });
    }

    // Trigger animations on scroll
    $(window).scroll(function() {
        var statsOffset = $('.stats-section').offset();
        if (statsOffset && $(window).scrollTop() + $(window).height() > statsOffset.top) {
            animateStats();
        }
    });

    // Form validation and submission
    $('form').on('submit', function(e) {
        var isValid = true;
        $(this).find('input[required], textarea[required], select[required]').each(function() {
            if (!$(this).val()) {
                isValid = false;
                $(this).addClass('error');
            } else {
                $(this).removeClass('error');
            }
        });

        if (!isValid) {
            e.preventDefault();
            alert('Please fill in all required fields.');
        }
    });

    // Remove error class on input
    $('input, textarea, select').on('input change', function() {
        $(this).removeClass('error');
    });

    // Cart indicator animation
    $('.cart-indicator').hover(function() {
        $(this).css('transform', 'scale(1.05)');
    }, function() {
        $(this).css('transform', 'scale(1)');
    });

    // WhatsApp float animation
    $('.whatsapp-float').hover(function() {
        $(this).css('transform', 'scale(1.05)');
    }, function() {
        $(this).css('transform', 'scale(1)');
    });

    // Product card hover effects
    $('.product-card').hover(function() {
        $(this).css('transform', 'translateY(-5px)');
    }, function() {
        $(this).css('transform', 'translateY(0)');
    });

    // Feature card hover effects
    $('.feature-card').hover(function() {
        $(this).css('transform', 'translateY(-5px)');
    }, function() {
        $(this).css('transform', 'translateY(0)');
    });

    // Responsive menu handling
    function handleResponsiveMenu() {
        const mobileToggle = $('.mobile-menu-toggle');
        const mainNav = $('.main-nav');
        
        if ($(window).width() <= 768) {
            mobileToggle.show();
            mainNav.hide();
        } else {
            mobileToggle.hide();
            mainNav.show();
            $('#mobile-nav').hide();
            $('#mobile-menu-icon').removeClass('fa-times').addClass('fa-bars');
        }
    }

    // Handle responsive menu on resize
    $(window).resize(handleResponsiveMenu);
    handleResponsiveMenu(); // Initial call

    // Auto-hide inquiry messages after 5 seconds
    setTimeout(function() {
        $('.inquiry-message').fadeOut();
    }, 5000);

    // Add loading state to buttons
    $('.btn').on('click', function() {
        var $btn = $(this);
        if ($btn.attr('type') === 'submit') {
            setTimeout(function() {
                $btn.html('<i class="fas fa-spinner fa-spin"></i> Processing...');
            }, 100);
        }
    });
});

// Add CSS for error states and animations
var style = document.createElement('style');
style.textContent = `
    .form-control.error {
        border-color: #dc3545 !important;
        box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.25) !important;
    }
    
    .site-header.scrolled {
        box-shadow: 0 2px 20px rgba(0,0,0,0.15);
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(10px);
    }
    
    .inquiry-message {
        position: fixed;
        top: 100px;
        right: 20px;
        max-width: 400px;
        z-index: 9999;
        border-radius: 0.5rem;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        animation: slideInRight 0.5s ease-out;
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .btn:active {
        transform: translateY(0);
    }
    
    @media (max-width: 768px) {
        .inquiry-message {
            right: 10px;
            left: 10px;
            max-width: none;
        }
        
        .hero-text h1 {
            font-size: 2.5rem !important;
        }
        
        .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
        }
        
        .contact-grid {
            grid-template-columns: 1fr !important;
        }
        
        .hero-buttons {
            flex-direction: column;
            align-items: center;
        }
        
        .btn {
            width: 100%;
            max-width: 300px;
            text-align: center;
            justify-content: center;
        }
    }
    
    @media (max-width: 480px) {
        .hero-text h1 {
            font-size: 2rem !important;
        }
        
        .stats-grid {
            grid-template-columns: 1fr !important;
        }
        
        .stat-number {
            font-size: 2rem !important;
        }
    }
`;
document.head.appendChild(style);