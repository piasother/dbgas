<?php
/**
 * DB Gas Theme Functions
 */

// Theme setup
function dbgas_theme_setup() {
    // Add theme support for WooCommerce
    add_theme_support('woocommerce');
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('wc-product-gallery-slider');
    
    // Add theme support for post thumbnails
    add_theme_support('post-thumbnails');
    
    // Add theme support for custom logo
    add_theme_support('custom-logo', array(
        'height'      => 100,
        'width'       => 400,
        'flex-height' => true,
        'flex-width'  => true,
    ));
    
    // Add theme support for HTML5
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
    ));
    
    // Register navigation menus
    register_nav_menus(array(
        'primary' => __('Primary Menu', 'dbgas'),
    ));
}
add_action('after_setup_theme', 'dbgas_theme_setup');

// Enqueue styles and scripts
function dbgas_enqueue_assets() {
    // Enqueue main stylesheet
    wp_enqueue_style('dbgas-style', get_stylesheet_uri());
    
    // Enqueue Google Fonts
    wp_enqueue_style('google-fonts', 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    // Enqueue Font Awesome
    wp_enqueue_style('font-awesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
    
    // Enqueue jQuery
    wp_enqueue_script('jquery');
    
    // Enqueue theme JavaScript
    wp_enqueue_script('dbgas-script', get_template_directory_uri() . '/js/theme.js', array('jquery'), '1.0.0', true);
    
    // Localize script for AJAX
    wp_localize_script('dbgas-script', 'dbgas_ajax', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('dbgas_nonce')
    ));
}
add_action('wp_enqueue_scripts', 'dbgas_enqueue_assets');

// Handle contact form submission
function handle_inquiry_submission() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['inquiry_nonce'], 'submit_inquiry_nonce')) {
        wp_die('Security check failed');
    }
    
    // Sanitize form data
    $name = sanitize_text_field($_POST['customer_name']);
    $phone = sanitize_text_field($_POST['customer_phone']);
    $inquiry_type = sanitize_text_field($_POST['inquiry_type']);
    $message = sanitize_textarea_field($_POST['message']);
    
    // Validate required fields
    if (empty($name) || empty($phone) || empty($inquiry_type) || empty($message)) {
        wp_redirect(home_url('/?inquiry=error'));
        exit;
    }
    
    // Send email to admin
    $to = get_option('admin_email');
    $subject = 'New Inquiry from DB Gas Website - ' . ucfirst($inquiry_type);
    $email_message = "New inquiry received:\n\n";
    $email_message .= "Name: " . $name . "\n";
    $email_message .= "Phone: " . $phone . "\n";
    $email_message .= "Inquiry Type: " . $inquiry_type . "\n";
    $email_message .= "Message: " . $message . "\n";
    $email_message .= "\nSubmitted from: " . home_url();
    
    $headers = array('Content-Type: text/plain; charset=UTF-8');
    
    $sent = wp_mail($to, $subject, $email_message, $headers);
    
    if ($sent) {
        wp_redirect(home_url('/?inquiry=success'));
    } else {
        wp_redirect(home_url('/?inquiry=error'));
    }
    exit;
}
add_action('admin_post_submit_inquiry', 'handle_inquiry_submission');
add_action('admin_post_nopriv_submit_inquiry', 'handle_inquiry_submission');

// Display inquiry status messages
function display_inquiry_messages() {
    if (isset($_GET['inquiry'])) {
        if ($_GET['inquiry'] === 'success') {
            echo '<div class="inquiry-message success" style="background-color: #d4edda; color: #155724; padding: 1rem; margin: 1rem 0; border-radius: 0.375rem; border: 1px solid #c3e6cb;">Thank you for your inquiry! We\'ll get back to you within 2 hours during business hours.</div>';
        } elseif ($_GET['inquiry'] === 'error') {
            echo '<div class="inquiry-message error" style="background-color: #f8d7da; color: #721c24; padding: 1rem; margin: 1rem 0; border-radius: 0.375rem; border: 1px solid #f5c6cb;">There was an error sending your inquiry. Please try again or contact us directly via WhatsApp.</div>';
        }
    }
}
add_action('wp_body_open', 'display_inquiry_messages');

// Create WooCommerce product categories on theme activation
function dbgas_create_product_categories() {
    if (!function_exists('wp_insert_term')) {
        return;
    }
    
    // Create LPG category
    $lpg_cat = wp_insert_term('LPG Products', 'product_cat', array(
        'description' => 'LPG cylinders and refills for residential and commercial use',
        'slug' => 'lpg'
    ));
    
    // Create Accessories category
    $accessories_cat = wp_insert_term('Accessories', 'product_cat', array(
        'description' => 'LPG accessories including regulators, hoses, and conversion kits',
        'slug' => 'accessories'
    ));
}

// Create sample products on theme activation
function dbgas_create_sample_products() {
    if (!class_exists('WooCommerce')) {
        return;
    }
    
    // Check if products already exist
    $existing_products = get_posts(array(
        'post_type' => 'product',
        'meta_query' => array(
            array(
                'key' => '_dbgas_sample_product',
                'value' => 'yes'
            )
        )
    ));
    
    if (!empty($existing_products)) {
        return; // Sample products already exist
    }
    
    $products = array(
        array(
            'name' => '9kg Cylinder Refill',
            'price' => 11.00,
            'description' => 'Perfect for small households and apartments. Clean burning and efficient.',
            'category' => 'lpg',
            'image' => 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'
        ),
        array(
            'name' => '19kg Cylinder Refill',
            'price' => 22.00,
            'description' => 'Ideal for families and medium-sized businesses. Long-lasting supply.',
            'category' => 'lpg',
            'image' => 'https://images.unsplash.com/photo-1574263867128-2e2c9cf14319?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'
        ),
        array(
            'name' => '48kg Cylinder Purchase',
            'price' => 95.00,
            'description' => 'Heavy-duty cylinder for commercial use. Includes safety features.',
            'category' => 'lpg',
            'image' => 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'
        ),
        array(
            'name' => 'Empty 48kg Dual Valve Cylinder',
            'price' => 60.00,
            'description' => 'Professional-grade empty cylinder with dual valve system for safety.',
            'category' => 'lpg',
            'image' => 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'
        ),
        array(
            'name' => 'Regulator Set',
            'price' => 18.00,
            'description' => 'High-quality pressure regulator for safe gas flow control.',
            'category' => 'accessories',
            'image' => 'https://images.unsplash.com/photo-1609696942946-a2cf2be57815?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'
        ),
        array(
            'name' => '1.5m LPG Hose',
            'price' => 6.00,
            'description' => 'Durable, flexible hose for connecting appliances to gas supply.',
            'category' => 'accessories',
            'image' => 'https://images.unsplash.com/photo-1619983081563-430f63602796?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'
        ),
        array(
            'name' => 'Conversion Kit',
            'price' => 25.00,
            'description' => 'Complete kit for converting appliances to LPG operation.',
            'category' => 'accessories',
            'image' => 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'
        )
    );
    
    foreach ($products as $product_data) {
        $product = new WC_Product_Simple();
        $product->set_name($product_data['name']);
        $product->set_regular_price($product_data['price']);
        $product->set_short_description($product_data['description']);
        $product->set_status('publish');
        $product->set_stock_status('instock');
        $product->set_manage_stock(false);
        
        // Save the product
        $product_id = $product->save();
        
        // Mark as sample product
        update_post_meta($product_id, '_dbgas_sample_product', 'yes');
        
        // Set product category
        wp_set_object_terms($product_id, $product_data['category'], 'product_cat');
        
        // Set product image from URL (optional - requires additional handling)
        // This would typically require downloading and uploading the image
    }
}

// Theme activation hook
function dbgas_theme_activation() {
    dbgas_create_product_categories();
    dbgas_create_sample_products();
    
    // Flush rewrite rules
    flush_rewrite_rules();
}
add_action('after_switch_theme', 'dbgas_theme_activation');

// Customize WooCommerce
function dbgas_woocommerce_customizations() {
    // Remove WooCommerce default styles
    add_filter('woocommerce_enqueue_styles', '__return_empty_array');
    
    // Modify shop page display
    remove_action('woocommerce_before_shop_loop', 'woocommerce_catalog_ordering', 30);
    remove_action('woocommerce_before_shop_loop', 'woocommerce_result_count', 20);
}
add_action('init', 'dbgas_woocommerce_customizations');

// Add custom CSS for WooCommerce compatibility
function dbgas_woocommerce_styles() {
    if (class_exists('WooCommerce')) {
        ?>
        <style>
        .woocommerce ul.products li.product,
        .woocommerce-page ul.products li.product {
            background: var(--white);
            border-radius: 1rem;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            margin-bottom: 2rem;
        }
        
        .woocommerce ul.products li.product:hover,
        .woocommerce-page ul.products li.product:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        }
        
        .woocommerce ul.products li.product .price,
        .woocommerce-page ul.products li.product .price {
            color: var(--secondary-color);
            font-weight: bold;
            font-size: 1.25rem;
        }
        
        .woocommerce ul.products li.product .button,
        .woocommerce-page ul.products li.product .button {
            background-color: var(--secondary-color);
            color: var(--white);
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .woocommerce ul.products li.product .button:hover,
        .woocommerce-page ul.products li.product .button:hover {
            background-color: #e55a2b;
            transform: translateY(-2px);
        }
        
        .woocommerce .cart-collaterals,
        .woocommerce-page .cart-collaterals {
            background: var(--light-color);
            padding: 2rem;
            border-radius: 1rem;
            margin-top: 2rem;
        }
        </style>
        <?php
    }
}
add_action('wp_head', 'dbgas_woocommerce_styles');

// Widget areas
function dbgas_widgets_init() {
    register_sidebar(array(
        'name'          => __('Footer Widgets', 'dbgas'),
        'id'            => 'footer-widgets',
        'description'   => __('Add widgets here to appear in your footer.', 'dbgas'),
        'before_widget' => '<div class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h3 class="widget-title">',
        'after_title'   => '</h3>',
    ));
}
add_action('widgets_init', 'dbgas_widgets_init');

// Customize excerpt length
function dbgas_custom_excerpt_length($length) {
    return 20;
}
add_filter('excerpt_length', 'dbgas_custom_excerpt_length');

// Add custom meta boxes for products (optional enhancement)
function dbgas_add_product_meta_boxes() {
    add_meta_box(
        'dbgas_product_badge',
        'Product Badge',
        'dbgas_product_badge_callback',
        'product',
        'side',
        'default'
    );
}
add_action('add_meta_boxes', 'dbgas_add_product_meta_boxes');

function dbgas_product_badge_callback($post) {
    wp_nonce_field('dbgas_save_product_badge', 'dbgas_product_badge_nonce');
    $badge = get_post_meta($post->ID, '_dbgas_product_badge', true);
    ?>
    <label for="dbgas_product_badge">Badge Text:</label>
    <input type="text" id="dbgas_product_badge" name="dbgas_product_badge" value="<?php echo esc_attr($badge); ?>" style="width: 100%;" />
    <p class="description">Enter a badge text for this product (e.g., "ZERA Approved", "Most Popular")</p>
    <?php
}

function dbgas_save_product_badge($post_id) {
    if (!isset($_POST['dbgas_product_badge_nonce']) || !wp_verify_nonce($_POST['dbgas_product_badge_nonce'], 'dbgas_save_product_badge')) {
        return;
    }
    
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    
    if (isset($_POST['dbgas_product_badge'])) {
        update_post_meta($post_id, '_dbgas_product_badge', sanitize_text_field($_POST['dbgas_product_badge']));
    }
}
add_action('save_post', 'dbgas_save_product_badge');

?>