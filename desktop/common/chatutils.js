import { isEmoji, emojiToString } from '~/common/emojis';
import * as Actions from '~/common/actions';

async function _getAutocompleteUserAsync(text) {
  let autocompleteResults = await Actions.getAutocompleteAsync(text);
  let users = autocompleteResults.users;

  for (let i = 0; i < users.length; i++) {
    if (users[i].username === text) {
      return users[i];
    }
  }

  return null;
}

/*
Formats messages into an object that looks like:
{
  message: [
    {
      text: 'this is some text',
    },
    {
      emoji: 'smile',
    },
    {
      userId: 1,
    },
  ]
}

If the message has no users or emojis, it is sent as plain text.
*/
export async function formatMessageAsync(message, autocompleteCache) {
  let items = [];
  let start = 0;
  let i = 0;

  while (i < message.length) {
    if (message.charAt(i) === '@') {
      // Try converting all @... words into {userId: 1} items
      if (i > 0 && !/\s/.test(message.charAt(i - 1))) {
        i++;
        continue;
      }

      let j;
      for (j = i + 1; j < message.length; j++) {
        let c = message.charAt(j);

        let isUserTagValue =
          (c >= '0' && c <= '9') ||
          (c >= 'a' && c <= 'z') ||
          (c >= 'A' && c <= 'Z') ||
          c === '-' ||
          c === '_' ||
          c === '/';

        if (/\s/.test(c)) {
          break;
        }

        if (!isUserTagValue) {
          i = j + 1;
          continue;
        }
      }

      if (j >= message.length || /\s/.test(message.charAt(j))) {
        let tag = message.substr(i + 1, j - i - 1);
        let user = autocompleteCache.users[tag];

        // This should not be needed most of the time
        if (!user) {
          user = await _getAutocompleteUserAsync(tag);
        }

        if (user) {
          if (i > start) {
            items.push({
              text: message.substr(start, i - start),
            });
          }

          items.push({
            userId: user.userId,
          });

          i = j;
          start = i;
          continue;
        }
      }

      i = j + 1;
    } else if (message.charAt(i) === ':') {
      let j = i + 1;
      while (message.charAt(j) !== ':' && j < message.length) {
        j++;
      }

      let emojiBody = message.substr(i + 1, j - i - 1);
      if (isEmoji(emojiBody)) {
        if (i > start) {
          items.push({
            text: message.substr(start, i - start),
          });
        }

        items.push({
          emoji: emojiBody,
        });

        // +1 for the last :
        i = j + 1;
        start = i;
      } else {
        i++;
      }
    } else {
      i++;
    }
  }

  if (i > start) {
    items.push({ text: message.substr(start, i - start) });
  }

  if (items.length === 0) {
    return '';
  } else if (items.length === 1 && items[0].text) {
    return items[0].text;
  } else {
    return JSON.stringify({
      message: items,
    });
  }
}

export function convertToRichMessage(message) {
  let plainTextMessage = {
    message: [
      {
        text: message,
      },
    ],
  };

  if (message.charAt(0) !== '{') {
    return plainTextMessage;
  } else {
    try {
      return JSON.parse(message);
    } catch (e) {
      return plainTextMessage;
    }
  }
}

export function messageToString(message, social) {
  let txt = '';

  for (let i = 0; i < message.richMessage.message.length; i++) {
    let messagePart = message.richMessage.message[i];

    if (messagePart.text) {
      txt += messagePart.text;
    } else if (messagePart.userId) {
      if (social.userIdToUser[messagePart.userId]) {
        txt += `@${social.userIdToUser[messagePart.userId].username}`;
      }
    } else if (messagePart.emoji) {
      txt += emojiToString(messagePart.emoji);
    }
  }

  return txt;
}
