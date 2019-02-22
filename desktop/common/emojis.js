import EmojisJSON from 'emoji-datasource';
import SpriteSheet from 'emoji-datasource/img/messenger/sheets/32.png';
import * as React from 'react';

const NUM_BLOCKS = 52;
const SHORT_NAME_TO_OBJECT = {};

for (let i = 0; i < EmojisJSON.length; i++) {
  let emoji = EmojisJSON[i];
  SHORT_NAME_TO_OBJECT[emoji.short_name] = emoji;
}

export function isEmoji(text) {
  return !!SHORT_NAME_TO_OBJECT[text];
}

export function getEmojiComponent(text, size = 20) {
  let emoji = SHORT_NAME_TO_OBJECT[text];
  let px = emoji.sheet_x;
  let py = emoji.sheet_y;

  var style = {
    display: 'inline-block',
    backgroundImage: `url(${SpriteSheet})`,
    backgroundPosition: `left -${px * size}px top -${py * size}px`,
    backgroundSize: `${size * NUM_BLOCKS}px ${size * NUM_BLOCKS}px`,
    width: `${size}px`,
    height: `${size}px`,
    verticalAlign: 'middle',
  };

  return <span style={style} />;
}
