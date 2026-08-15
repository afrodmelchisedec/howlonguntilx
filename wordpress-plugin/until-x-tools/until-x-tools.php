<?php
/**
 * Plugin Name: Until X Tools Embed
 * Description: Shortcode to embed Until X calculators/trackers with auto-resize.
 * Version: 1.1.0
 * Author: Until X
 * License: GPL v2 or later
 * Text Domain: until-x-tools
 */

if (!defined('ABSPATH')) exit;

define('HLUX_BASE_URL', 'https://howlonguntilx.com');

function hlux_tool_shortcode($atts) {
    $atts = shortcode_atts([
        'slug'   => '',
        'height' => '480',
        'width'  => '100%',
    ], $atts, 'hlux_tool');

    if (empty($atts['slug'])) {
        return '<!-- hlux_tool: missing slug attribute -->';
    }

    $slug = sanitize_title($atts['slug']);
    $id = 'hlux-' . $slug . '-' . wp_generate_password(6, false);
    $embed_url = esc_url(HLUX_BASE_URL . '/embed/' . $slug);
    $tool_url  = esc_url(HLUX_BASE_URL . '/tools/' . $slug);

    ob_start();
    ?>
    <div class="hlux-embed-wrap">
        <iframe id="<?php echo esc_attr($id); ?>"
                src="<?php echo $embed_url; ?>"
                style="width:<?php echo esc_attr($atts['width']); ?>;height:<?php echo esc_attr($atts['height']); ?>px;border:0;display:block;margin:0 auto;"
                scrolling="no"
                loading="lazy"></iframe>
        <p style="font-size:11px;text-align:center;margin-top:6px;">
            <?php echo esc_html(ucwords(str_replace('-', ' ', $slug))); ?>
            — powered by <a href="<?php echo esc_url(HLUX_BASE_URL); ?>" target="_blank" rel="noopener">Until X</a>
        </p>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('hlux_tool', 'hlux_tool_shortcode');

function hlux_enqueue_resize_listener() {
    ?>
    <script>
    (function() {
        if (window.__hluxResizeListenerAttached) return;
        window.__hluxResizeListenerAttached = true;
        window.addEventListener('message', function(e) {
            if (!e.data || e.data.type !== 'hlux-embed-resize') return;
            document.querySelectorAll('iframe[id^="hlux-"]').forEach(function(f) {
                try {
                    if (f.contentWindow === e.source) f.style.height = e.data.height + 'px';
                } catch (err) {}
            });
        });
    })();
    </script>
    <?php
}


// -----------------------------------------------------------------------
// Admin page: lists available tool shortcodes so users don't have to
// remember slugs. Regenerate this array with:
//   node scripts/sync-wp-plugin-tools.js
// -----------------------------------------------------------------------
function hlux_available_tools() {
    return [
        ['slug' => 'payroll-runway', 'title' => 'Payday Runway'],
        ['slug' => 'tax-budget-deadlines', 'title' => 'Safe-Harbor Planner'],
        ['slug' => 'am-i-pregnant-probability-tracker', 'title' => 'Am I Pregnant? Probability Tracker'],
        ['slug' => 'labor-onset-predictor', 'title' => 'Labor Onset Predictor'],
        ['slug' => 'birth-control-effectiveness-countdown', 'title' => 'Birth Control Effectiveness Countdown'],
        ['slug' => 'newborn-milestone-tracker', 'title' => 'Newborn Milestone Tracker'],
        ['slug' => 'baby-animal-nest-watch', 'title' => 'Baby Animal Nest-Watch'],
        ['slug' => 'kitten-growth-tracker', 'title' => 'Kitten Growth Tracker'],
        ['slug' => 'egg-hatch-calculator', 'title' => 'Egg Hatch Countdown Calculator'],
        ['slug' => 'pet-growth-gestation-calculator', 'title' => 'Pet Fully Grown & Gestation Calculator'],
        ['slug' => 'garden-growth-bloom-tracker', 'title' => 'Garden Growth & Bloom Tracker'],
    ];
}

function hlux_add_admin_menu() {
    add_options_page('Until X Tools', 'Until X Tools', 'manage_options', 'until-x-tools', 'hlux_render_admin_page');
}
add_action('admin_menu', 'hlux_add_admin_menu');

function hlux_render_admin_page() {
    $tools = hlux_available_tools();
    ?>
    <div class="wrap">
        <h1>Until X Tools</h1>
        <p>Copy a shortcode below into any post or page.</p>
        <table class="widefat striped">
            <thead><tr><th>Tool</th><th>Shortcode</th><th></th></tr></thead>
            <tbody>
                <?php foreach ($tools as $t): $code = '[hlux_tool slug="' . esc_attr($t['slug']) . '"]'; ?>
                <tr>
                    <td><?php echo esc_html($t['title']); ?></td>
                    <td><code class="hlux-shortcode"><?php echo esc_html($code); ?></code></td>
                    <td><button type="button" class="button hlux-copy-btn" data-code="<?php echo esc_attr($code); ?>">Copy</button></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <script>
    document.querySelectorAll('.hlux-copy-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            navigator.clipboard.writeText(btn.dataset.code);
            var original = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(function() { btn.textContent = original; }, 1200);
        });
    });
    </script>
    <?php
}

add_action('wp_footer', 'hlux_enqueue_resize_listener');
