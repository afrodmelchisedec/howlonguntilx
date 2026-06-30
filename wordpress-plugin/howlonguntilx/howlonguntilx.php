<?php
/**
 * Plugin Name: HowLongUntil Countdown
 * Description: Embed countdown timers via shortcode or Gutenberg block.
 * Version: 1.0.0
 * Author: HowLongUntil
 */
defined('ABSPATH') || exit;

define('HLU_API', 'https://howlonguntilx.com/api/countdown');
define('HLU_EMBED', 'https://howlonguntilx.com/embed/widget');

// ── Shortcode: [howlonguntilx event="christmas"] ───────────────
function hlu_shortcode(array $atts): string {
    $atts = shortcode_atts(['event' => 'christmas', 'theme' => 'light', 'width' => '300', 'height' => '160'], $atts);
    $url  = add_query_arg(['event' => esc_attr($atts['event']), 'theme' => esc_attr($atts['theme'])], HLU_EMBED);
    return sprintf(
        '<iframe src="%s" width="%s" height="%s" frameborder="0" loading="lazy" style="border:none;border-radius:8px;"></iframe>',
        esc_url($url),
        esc_attr($atts['width']),
        esc_attr($atts['height'])
    );
}
add_shortcode('howlonguntilx', 'hlu_shortcode');

// ── REST proxy for API data ────────────────────────────────────
function hlu_register_rest(): void {
    register_rest_route('hlu/v1', '/countdown', [
        'methods'             => 'GET',
        'callback'            => 'hlu_rest_callback',
        'permission_callback' => '__return_true',
    ]);
}
add_action('rest_api_init', 'hlu_register_rest');

function hlu_rest_callback(WP_REST_Request $req): WP_REST_Response|WP_Error {
    $event = sanitize_text_field($req->get_param('event'));
    $url   = add_query_arg(['event' => $event], HLU_API);
    $resp  = wp_remote_get($url, ['timeout' => 5]);
    if (is_wp_error($resp)) return $resp;
    $data = json_decode(wp_remote_retrieve_body($resp), true);
    return new WP_REST_Response($data, 200);
}

// ── Gutenberg block ────────────────────────────────────────────
function hlu_register_block(): void {
    register_block_type(plugin_dir_path(__FILE__) . 'block');
}
add_action('init', 'hlu_register_block');
