# DB Gas WordPress Theme

A professional multi-page eCommerce WordPress theme for DB Gas, an LPG retail and wholesale company in Zimbabwe.

## Features

- **Full WordPress Integration**: Complete WordPress theme with header, footer, and main template
- **WooCommerce Ready**: Built-in support for WooCommerce with custom product layouts
- **Responsive Design**: Mobile-first design that works on all devices
- **Professional Layout**: Hero section, stats, services, shop, commercial applications, safety compliance, and contact sections
- **Contact Form Integration**: Built-in contact form with admin email notifications
- **Zimbabwe LPG Focus**: Tailored specifically for the Zimbabwe LPG market
- **ZERA Compliance**: Highlights regulatory compliance and safety standards

## Installation Instructions

1. **Upload Theme**:
   - Compress the `wordpress-theme` folder into a ZIP file
   - Go to WordPress Admin → Appearance → Themes → Add New
   - Click "Upload Theme" and select the ZIP file
   - Click "Install Now" and then "Activate"

2. **Install Required Plugins**:
   - **WooCommerce**: For eCommerce functionality
   - **Contact Form 7** (optional): For enhanced contact forms
   - Both can be installed from WordPress Admin → Plugins → Add New

3. **Configure WooCommerce**:
   - Go to WooCommerce → Settings to configure:
     - Store location: Zimbabwe
     - Currency: USD
     - Payment methods: EcoCash, Bank Transfer, Cash on Delivery
   - Create product categories: "LPG Products" and "Accessories"

4. **Add Products**:
   - The theme automatically creates sample products on activation
   - Go to Products → All Products to manage them
   - Add your own product images and update prices as needed

5. **Customize Contact Information**:
   - Update phone numbers, addresses, and email in the theme files
   - Modify WhatsApp link in `header.php` (line 62)
   - Update contact details in `index.php` contact section

## Theme Structure

```
wordpress-theme/
├── style.css          # Main stylesheet with theme information
├── index.php          # Main template file with all sections
├── header.php         # Header template with navigation
├── footer.php         # Footer template
├── functions.php      # Theme functions and WooCommerce integration
├── js/
│   └── theme.js       # JavaScript for interactions and animations
└── README.md          # This file
```

## Customization

### Colors
The theme uses CSS custom properties (variables) defined in `style.css`:
- `--primary-color`: #1B365D (Dark blue)
- `--secondary-color`: #FF6B35 (Orange)
- `--accent-color`: #4A90E2 (Light blue)
- `--success-color`: #28A745 (Green)

### Contact Information
Update these locations:
1. `index.php` - Contact section (lines 450-500)
2. `header.php` - WhatsApp link (line 62)
3. Phone numbers: +263 77 123 4567
4. Email: info@dbgas.co.zw

### Products
- Products are managed through WooCommerce
- Custom product badges can be added via the product edit screen
- Categories: "LPG Products" and "Accessories"

## WooCommerce Integration

The theme includes:
- Custom product grid layouts
- Shopping cart integration
- Checkout process
- Product categories display
- Price formatting for USD currency

## Mobile Responsiveness

- Responsive navigation with mobile menu
- Optimized layouts for tablets and phones
- Touch-friendly buttons and interactions
- Scalable images and typography

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Internet Explorer 11+ (limited support)
- Mobile browsers (iOS Safari, Android Chrome)

## Support

For theme customization or technical support, contact your WordPress developer or refer to WordPress documentation for standard theme modification practices.

## Zimbabwe-Specific Features

- Currency display in USD
- ZERA compliance messaging
- EMA certification highlights
- Bulawayo and Harare office locations
- WhatsApp integration for local communication preferences
- 2-hour delivery service highlighting
- Commercial applications relevant to Zimbabwe market

## Performance

The theme is optimized for:
- Fast loading times
- SEO-friendly structure
- Accessible design
- Minimal external dependencies (only Google Fonts and Font Awesome)

## Updates

When updating the theme:
1. Backup your current theme files
2. Note any customizations made
3. Upload the new theme files
4. Reapply customizations if needed