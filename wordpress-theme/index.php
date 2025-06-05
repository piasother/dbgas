<?php
/**
 * The main template file
 *
 * This is the most generic template file in a WordPress theme
 * and one of the two required files for a theme (the other being style.css).
 */

get_header(); ?>

<main id="main" class="site-main">
    <!-- Hero Section -->
    <section class="hero-section">
        <div class="container">
            <div class="hero-content">
                <div class="hero-text">
                    <h1>Fueling Zimbabwe Safely — From Homes to Industry</h1>
                    <p>Reliable LPG supply across Zimbabwe with 2-hour delivery, professional installations, and ZERA-compliant safety standards.</p>
                    <div class="hero-buttons">
                        <a href="#shop-section" class="btn btn-primary">
                            <i class="fas fa-shopping-cart"></i>
                            Order Gas Now
                        </a>
                        <a href="#accessories-section" class="btn btn-outline">
                            <i class="fas fa-tools"></i>
                            Shop Accessories
                        </a>
                        <a href="#commercial-section" class="btn btn-outline">
                            <i class="fas fa-building"></i>
                            Commercial Solutions
                        </a>
                    </div>
                </div>
                <div class="hero-image">
                    <img src="https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                         alt="LPG Storage Facility" class="hero-img">
                </div>
            </div>
        </div>
    </section>

    <!-- Stats Section -->
    <div class="container">
        <div class="stats-section">
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-number">2hr</span>
                    <p class="stat-label">Delivery Time</p>
                </div>
                <div class="stat-item">
                    <span class="stat-number">50t</span>
                    <p class="stat-label">Storage Capacity</p>
                </div>
                <div class="stat-item">
                    <span class="stat-number">24/7</span>
                    <p class="stat-label">Emergency Service</p>
                </div>
                <div class="stat-item">
                    <span class="stat-number">ZERA</span>
                    <p class="stat-label">Licensed</p>
                </div>
            </div>
        </div>
    </div>

    <!-- About Section -->
    <section id="about" class="section">
        <div class="container">
            <div class="row">
                <div class="col col-2">
                    <h2 class="section-title">About DB Gas</h2>
                    <p>Leading LPG supplier in Zimbabwe, serving residential and commercial customers with reliable, safe energy solutions since establishment.</p>
                    
                    <div class="feature-grid" style="grid-template-columns: 1fr; gap: 1.5rem; margin-top: 2rem;">
                        <div class="feature-card" style="text-align: left; padding: 1.5rem;">
                            <h5><i class="fas fa-certificate" style="color: var(--primary-color); margin-right: 0.75rem;"></i>Fully Licensed</h5>
                            <p>Licensed by ZERA, EMA, and Bulawayo City Council for complete compliance.</p>
                        </div>
                        <div class="feature-card" style="text-align: left; padding: 1.5rem;">
                            <h5><i class="fas fa-tools" style="color: var(--primary-color); margin-right: 0.75rem;"></i>Professional Equipment</h5>
                            <p>TLB machinery, thrust boring units, mobile refill trailers, and cylinder cages.</p>
                        </div>
                    </div>
                    
                    <div style="margin-top: 2rem;">
                        <h5>Our Mission</h5>
                        <p>To provide safe, reliable, and affordable LPG solutions that power Zimbabwe's homes and industries while maintaining the highest safety standards.</p>
                    </div>
                </div>
                <div class="col col-2">
                    <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                         alt="Professional Installation Team" style="width: 100%; height: auto; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                </div>
            </div>
        </div>
    </section>

    <!-- Services Section -->
    <section id="services" class="section section-alt">
        <div class="container">
            <h2 class="section-title">Our Services</h2>
            <div class="feature-grid">
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-gas-pump"></i>
                    </div>
                    <h5>Cylinder Refills</h5>
                    <p>Quick refills for 9kg, 19kg, and 48kg cylinders with same-day service.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-truck"></i>
                    </div>
                    <h5>Wholesale Supply</h5>
                    <p>Bulk LPG supply from our 25-tonne skid tanks for commercial customers.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-wrench"></i>
                    </div>
                    <h5>Tank Installations</h5>
                    <p>Professional LPG tank installations for commercial and residential properties.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h5>Safety Audits</h5>
                    <p>ZERA compliance support and comprehensive safety audits for businesses.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Shop Section (WooCommerce Integration) -->
    <section id="shop-section" class="section">
        <div class="container">
            <h2 class="section-title">Shop Online</h2>
            <div class="mb-4">
                <h4 style="color: var(--primary-color); margin-bottom: 2rem;">LPG Products</h4>
                <div class="product-grid">
                    <?php
                    // Display WooCommerce products in LPG category
                    $lpg_products = wc_get_products(array(
                        'category' => array('lpg'),
                        'limit' => 8,
                        'status' => 'publish'
                    ));
                    
                    if (!empty($lpg_products)) {
                        foreach ($lpg_products as $product) {
                            $product_id = $product->get_id();
                            $product_name = $product->get_name();
                            $product_price = $product->get_price();
                            $product_image = wp_get_attachment_image_src(get_post_thumbnail_id($product_id), 'medium');
                            $product_description = wp_trim_words($product->get_short_description(), 15);
                            $product_url = get_permalink($product_id);
                            ?>
                            <div class="product-card">
                                <img src="<?php echo $product_image ? esc_url($product_image[0]) : 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'; ?>" 
                                     alt="<?php echo esc_attr($product_name); ?>" class="product-image">
                                <div class="product-content">
                                    <span class="product-badge">ZERA Approved</span>
                                    <h5 class="product-title"><?php echo esc_html($product_name); ?></h5>
                                    <p class="product-description"><?php echo esc_html($product_description); ?></p>
                                    <div class="product-footer">
                                        <span class="product-price">$<?php echo number_format($product_price, 2); ?></span>
                                        <a href="<?php echo esc_url($product_url); ?>" class="btn btn-primary">
                                            <i class="fas fa-cart-plus"></i>
                                            Add to Cart
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <?php
                        }
                    } else {
                        // Fallback products if WooCommerce is not set up
                        $fallback_products = array(
                            array('name' => '9kg Cylinder Refill', 'price' => '11.00', 'desc' => 'Perfect for small households and apartments. Clean burning and efficient.', 'badge' => 'ZERA Approved'),
                            array('name' => '19kg Cylinder Refill', 'price' => '22.00', 'desc' => 'Ideal for families and medium-sized businesses. Long-lasting supply.', 'badge' => 'Most Popular'),
                            array('name' => '48kg Cylinder Purchase', 'price' => '95.00', 'desc' => 'Heavy-duty cylinder for commercial use. Includes safety features.', 'badge' => 'Commercial Grade'),
                            array('name' => 'Empty 48kg Dual Valve Cylinder', 'price' => '60.00', 'desc' => 'Professional-grade empty cylinder with dual valve system for safety.', 'badge' => 'Dual Valve')
                        );
                        
                        foreach ($fallback_products as $product) {
                            ?>
                            <div class="product-card">
                                <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                                     alt="<?php echo esc_attr($product['name']); ?>" class="product-image">
                                <div class="product-content">
                                    <span class="product-badge"><?php echo esc_html($product['badge']); ?></span>
                                    <h5 class="product-title"><?php echo esc_html($product['name']); ?></h5>
                                    <p class="product-description"><?php echo esc_html($product['desc']); ?></p>
                                    <div class="product-footer">
                                        <span class="product-price">$<?php echo esc_html($product['price']); ?></span>
                                        <a href="#contact" class="btn btn-primary">
                                            <i class="fas fa-phone"></i>
                                            Contact for Order
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <?php
                        }
                    }
                    ?>
                </div>
            </div>
        </div>
    </section>

    <!-- Accessories Section -->
    <section id="accessories-section" class="section section-alt">
        <div class="container">
            <h2 class="section-title">LPG Accessories</h2>
            <div class="product-grid">
                <?php
                // Display WooCommerce products in accessories category
                $accessory_products = wc_get_products(array(
                    'category' => array('accessories'),
                    'limit' => 4,
                    'status' => 'publish'
                ));
                
                if (!empty($accessory_products)) {
                    foreach ($accessory_products as $product) {
                        $product_id = $product->get_id();
                        $product_name = $product->get_name();
                        $product_price = $product->get_price();
                        $product_image = wp_get_attachment_image_src(get_post_thumbnail_id($product_id), 'medium');
                        $product_description = wp_trim_words($product->get_short_description(), 15);
                        $product_url = get_permalink($product_id);
                        ?>
                        <div class="product-card">
                            <img src="<?php echo $product_image ? esc_url($product_image[0]) : 'https://images.unsplash.com/photo-1609696942946-a2cf2be57815?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'; ?>" 
                                 alt="<?php echo esc_attr($product_name); ?>" class="product-image">
                            <div class="product-content">
                                <span class="product-badge">Safety Certified</span>
                                <h5 class="product-title"><?php echo esc_html($product_name); ?></h5>
                                <p class="product-description"><?php echo esc_html($product_description); ?></p>
                                <div class="product-footer">
                                    <span class="product-price">$<?php echo number_format($product_price, 2); ?></span>
                                    <a href="<?php echo esc_url($product_url); ?>" class="btn btn-primary">
                                        <i class="fas fa-cart-plus"></i>
                                        Add to Cart
                                    </a>
                                </div>
                            </div>
                        </div>
                        <?php
                    }
                } else {
                    // Fallback accessories
                    $fallback_accessories = array(
                        array('name' => 'Regulator Set', 'price' => '18.00', 'desc' => 'High-quality pressure regulator for safe gas flow control.'),
                        array('name' => '1.5m LPG Hose', 'price' => '6.00', 'desc' => 'Durable, flexible hose for connecting appliances to gas supply.'),
                        array('name' => 'Conversion Kit', 'price' => '25.00', 'desc' => 'Complete kit for converting appliances to LPG operation.')
                    );
                    
                    foreach ($fallback_accessories as $product) {
                        ?>
                        <div class="product-card">
                            <img src="https://images.unsplash.com/photo-1609696942946-a2cf2be57815?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                                 alt="<?php echo esc_attr($product['name']); ?>" class="product-image">
                            <div class="product-content">
                                <span class="product-badge">Safety Certified</span>
                                <h5 class="product-title"><?php echo esc_html($product['name']); ?></h5>
                                <p class="product-description"><?php echo esc_html($product['desc']); ?></p>
                                <div class="product-footer">
                                    <span class="product-price">$<?php echo esc_html($product['price']); ?></span>
                                    <a href="#contact" class="btn btn-primary">
                                        <i class="fas fa-phone"></i>
                                        Contact for Order
                                    </a>
                                </div>
                            </div>
                        </div>
                        <?php
                    }
                }
                ?>
                
                <!-- Safety Tips Card -->
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <h5>Safety Tips</h5>
                    <ul style="text-align: left; list-style: none; padding: 0;">
                        <li style="margin-bottom: 0.5rem;"><i class="fas fa-check" style="color: var(--success-color); margin-right: 0.5rem;"></i>Always check for leaks</li>
                        <li style="margin-bottom: 0.5rem;"><i class="fas fa-check" style="color: var(--success-color); margin-right: 0.5rem;"></i>Store in ventilated areas</li>
                        <li style="margin-bottom: 0.5rem;"><i class="fas fa-check" style="color: var(--success-color); margin-right: 0.5rem;"></i>Regular maintenance</li>
                        <li style="margin-bottom: 0.5rem;"><i class="fas fa-check" style="color: var(--success-color); margin-right: 0.5rem;"></i>Professional installation</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <!-- Commercial Section -->
    <section id="commercial-section" class="section">
        <div class="container">
            <h2 class="section-title">Commercial Applications</h2>
            <div class="row">
                <div class="col col-2">
                    <h3 style="margin-bottom: 2rem;">Industries We Serve</h3>
                    <div class="feature-grid" style="grid-template-columns: 1fr; gap: 1.5rem;">
                        <div class="feature-card" style="text-align: left; padding: 1.5rem;">
                            <h5><i class="fas fa-bread-slice" style="color: var(--primary-color); margin-right: 0.75rem;"></i>Bakeries & Restaurants</h5>
                            <p>Professional LPG ovens, fryers, and cooking equipment for commercial kitchens.</p>
                        </div>
                        <div class="feature-card" style="text-align: left; padding: 1.5rem;">
                            <h5><i class="fas fa-seedling" style="color: var(--primary-color); margin-right: 0.75rem;"></i>Dairy & Poultry Farms</h5>
                            <p>Reliable heating solutions for boilers, heaters, and agricultural processes.</p>
                        </div>
                        <div class="feature-card" style="text-align: left; padding: 1.5rem;">
                            <h5><i class="fas fa-hotel" style="color: var(--primary-color); margin-right: 0.75rem;"></i>Lodges & Hotels</h5>
                            <p>Complete LPG systems for hot water, kitchen operations, and heating.</p>
                        </div>
                        <div class="feature-card" style="text-align: left; padding: 1.5rem;">
                            <h5><i class="fas fa-hospital" style="color: var(--primary-color); margin-right: 0.75rem;"></i>Schools & Hospitals</h5>
                            <p>Bulk tank installations for institutional cooking and heating needs.</p>
                        </div>
                    </div>
                    
                    <a href="#contact" class="btn btn-primary" style="margin-top: 2rem;">
                        <i class="fas fa-calendar-check"></i>
                        Request a Free Site Visit
                    </a>
                </div>
                <div class="col col-2">
                    <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                         alt="Commercial Kitchen" style="width: 100%; height: auto; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                </div>
            </div>
        </div>
    </section>

    <!-- Safety & Compliance Section -->
    <section id="safety" class="section section-alt">
        <div class="container">
            <h2 class="section-title">Safety & Compliance</h2>
            <div class="row">
                <div class="col" style="flex: 0 0 75%;">
                    <div class="feature-grid" style="grid-template-columns: repeat(2, 1fr);">
                        <div class="feature-card" style="text-align: left;">
                            <h5><i class="fas fa-shield-alt" style="color: var(--success-color); margin-right: 0.75rem;"></i>ZERA Compliance</h5>
                            <p>Full compliance with Zimbabwe Energy Regulatory Authority standards for LPG handling and distribution.</p>
                        </div>
                        <div class="feature-card" style="text-align: left;">
                            <h5><i class="fas fa-leaf" style="color: var(--success-color); margin-right: 0.75rem;"></i>EMA Certified</h5>
                            <p>Environmental Management Agency certification ensuring eco-friendly operations and waste management.</p>
                        </div>
                        <div class="feature-card" style="text-align: left;">
                            <h5><i class="fas fa-city" style="color: var(--success-color); margin-right: 0.75rem;"></i>City Council Licensed</h5>
                            <p>Authorized by Bulawayo City Council for commercial LPG operations within municipal boundaries.</p>
                        </div>
                        <div class="feature-card" style="text-align: left;">
                            <h5><i class="fas fa-download" style="color: var(--primary-color); margin-right: 0.75rem;"></i>Download Resources</h5>
                            <div style="margin-top: 1rem;">
                                <a href="#" class="btn btn-outline" style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem;">LPG Safety Guide</a>
                                <a href="#" class="btn btn-outline" style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem;">Installation Guide</a>
                                <a href="#" class="btn btn-outline" style="display: block; font-size: 0.875rem;">Storage Checklist</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col" style="flex: 0 0 25%;">
                    <img src="https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                         alt="Safety Equipment" style="width: 100%; height: auto; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                </div>
            </div>
        </div>
    </section>

    <!-- Compliance Badges -->
    <section class="section" style="background-color: #f1f3f4; padding: 4rem 0;">
        <div class="container">
            <div class="feature-grid">
                <div class="text-center">
                    <div style="width: 80px; height: 80px; background: var(--white); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.1); font-size: 2rem; color: var(--primary-color);">
                        <i class="fas fa-certificate"></i>
                    </div>
                    <h6 style="font-weight: 600; color: var(--text-dark);">ZERA Licensed</h6>
                    <p style="font-size: 0.875rem; color: var(--text-light);">Energy Regulatory Authority</p>
                </div>
                <div class="text-center">
                    <div style="width: 80px; height: 80px; background: var(--white); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.1); font-size: 2rem; color: var(--primary-color);">
                        <i class="fas fa-leaf"></i>
                    </div>
                    <h6 style="font-weight: 600; color: var(--text-dark);">EMA Certified</h6>
                    <p style="font-size: 0.875rem; color: var(--text-light);">Environmental Management</p>
                </div>
                <div class="text-center">
                    <div style="width: 80px; height: 80px; background: var(--white); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.1); font-size: 2rem; color: var(--primary-color);">
                        <i class="fas fa-city"></i>
                    </div>
                    <h6 style="font-weight: 600; color: var(--text-dark);">City Licensed</h6>
                    <p style="font-size: 0.875rem; color: var(--text-light);">Bulawayo City Council</p>
                </div>
                <div class="text-center">
                    <div style="width: 80px; height: 80px; background: var(--white); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.1); font-size: 2rem; color: var(--primary-color);">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h6 style="font-weight: 600; color: var(--text-dark);">ISO Compliant</h6>
                    <p style="font-size: 0.875rem; color: var(--text-light);">International Standards</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="section contact-section">
        <div class="container">
            <div class="contact-grid">
                <div>
                    <h2 style="color: var(--white); margin-bottom: 2rem;">Get in Touch</h2>
                    
                    <div class="contact-info">
                        <div class="contact-item">
                            <h5><i class="fas fa-map-marker-alt" style="color: var(--primary-color); margin-right: 0.75rem;"></i>Bulawayo Office</h5>
                            <p>123 Industrial Road<br>Kelvin North, Bulawayo</p>
                            <p><strong>Hours:</strong> Mon-Fri 8AM-5PM, Sat 8AM-1PM</p>
                        </div>
                        <div class="contact-item">
                            <h5><i class="fas fa-map-marker-alt" style="color: var(--primary-color); margin-right: 0.75rem;"></i>Harare Office</h5>
                            <p>456 Enterprise Drive<br>Msasa, Harare</p>
                            <p><strong>Hours:</strong> Mon-Fri 8AM-5PM, Sat 8AM-1PM</p>
                        </div>
                    </div>
                    
                    <div class="feature-grid" style="grid-template-columns: repeat(3, 1fr); margin-top: 2rem;">
                        <div>
                            <h6 style="color: var(--white); margin-bottom: 0.5rem;"><i class="fas fa-phone" style="margin-right: 0.5rem;"></i>Emergency</h6>
                            <p style="color: rgba(255,255,255,0.9);">+263 77 123 4567</p>
                        </div>
                        <div>
                            <h6 style="color: var(--white); margin-bottom: 0.5rem;"><i class="fas fa-envelope" style="margin-right: 0.5rem;"></i>Email</h6>
                            <p style="color: rgba(255,255,255,0.9);">info@dbgas.co.zw</p>
                        </div>
                        <div>
                            <h6 style="color: var(--white); margin-bottom: 0.5rem;"><i class="fab fa-whatsapp" style="margin-right: 0.5rem;"></i>WhatsApp</h6>
                            <p style="color: rgba(255,255,255,0.9);">+263 77 123 4567</p>
                        </div>
                    </div>
                </div>
                
                <div class="contact-form">
                    <div style="background-color: var(--light-color); padding: 1rem; border-radius: 0.5rem 0.5rem 0 0;">
                        <h5>Quick Inquiry</h5>
                    </div>
                    <div style="padding: 1.5rem;">
                        <?php echo do_shortcode('[contact-form-7 id="1" title="Contact form 1"]'); ?>
                        
                        <!-- Fallback contact form if Contact Form 7 is not installed -->
                        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                            <input type="hidden" name="action" value="submit_inquiry">
                            <?php wp_nonce_field('submit_inquiry_nonce', 'inquiry_nonce'); ?>
                            
                            <div class="form-group">
                                <input type="text" name="customer_name" class="form-control" placeholder="Your Name" required>
                            </div>
                            <div class="form-group">
                                <input type="tel" name="customer_phone" class="form-control" placeholder="Phone Number" required>
                            </div>
                            <div class="form-group">
                                <select name="inquiry_type" class="form-control" required>
                                    <option value="">Inquiry Type</option>
                                    <option value="residential">Residential Supply</option>
                                    <option value="commercial">Commercial Solutions</option>
                                    <option value="installation">Installation Service</option>
                                    <option value="emergency">Emergency Service</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <textarea name="message" class="form-control" rows="3" placeholder="Your Message" required></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%;">Send Inquiry</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </section>
</main>

<?php get_footer(); ?>