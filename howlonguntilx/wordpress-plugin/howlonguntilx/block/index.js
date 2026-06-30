const { registerBlockType } = wp.blocks;
const { InspectorControls } = wp.blockEditor;
const { PanelBody, TextControl, SelectControl, RangeControl } = wp.components;

registerBlockType('hlu/countdown', {
  edit({ attributes, setAttributes }) {
    const { event, theme, width, height } = attributes;
    const src = `https://howlonguntilx.com/embed/widget?event=${event}&theme=${theme}`;
    return wp.element.createElement('div', null,
      wp.element.createElement(InspectorControls, null,
        wp.element.createElement(PanelBody, { title: 'Countdown Settings', initialOpen: true },
          wp.element.createElement(TextControl, { label: 'Event', value: event, onChange: v => setAttributes({ event: v }) }),
          wp.element.createElement(SelectControl, { label: 'Theme', value: theme, options: [{ label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }], onChange: v => setAttributes({ theme: v }) }),
          wp.element.createElement(RangeControl, { label: 'Width', value: width, min: 200, max: 800, onChange: v => setAttributes({ width: v }) }),
          wp.element.createElement(RangeControl, { label: 'Height', value: height, min: 100, max: 400, onChange: v => setAttributes({ height: v }) })
        )
      ),
      wp.element.createElement('iframe', { src, width, height, frameBorder: '0', style: { border: 'none', borderRadius: '8px' } })
    );
  },
  save: () => null,
});
