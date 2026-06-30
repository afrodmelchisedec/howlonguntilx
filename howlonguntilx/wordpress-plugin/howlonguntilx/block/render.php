<?php
$url = add_query_arg(
    ['event' => esc_attr($attributes['event']), 'theme' => esc_attr($attributes['theme'])],
    'https://howlonguntilx.com/embed/widget'
);
?>
<iframe
  src="<?php echo esc_url($url); ?>"
  width="<?php echo esc_attr($attributes['width']); ?>"
  height="<?php echo esc_attr($attributes['height']); ?>"
  frameborder="0"
  loading="lazy"
  style="border:none;border-radius:8px;">
</iframe>
