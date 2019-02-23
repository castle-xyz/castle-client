import { isEmoji } from '~/common/emojis';
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

export async function formatMessageAsync(inputValue, autocompleteCache) {
  // Follows Slack's rules for escaping characters https://api.slack.com/docs/message-formatting

  let i = 0;

  while (i < inputValue.length) {
    if (inputValue.charAt(i) === '@') {
      // Try converting all @... words into <user:USER_ID> tags
      if (i > 0 && !/\s/.test(inputValue.charAt(i - 1))) {
        i++;
        continue;
      }

      let j;
      for (j = i + 1; j < inputValue.length; j++) {
        let c = inputValue.charAt(j);

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

      if (j >= inputValue.length || /\s/.test(inputValue.charAt(j))) {
        let tag = inputValue.substr(i + 1, j - i - 1);
        let user = autocompleteCache.users[tag];

        // This should be needed most of the time
        if (!user) {
          user = await _getAutocompleteUserAsync(tag);
        }

        if (user) {
          let richObject = `<user:${autocompleteCache.users[tag].userId}>`;
          inputValue = inputValue.substr(0, i) + richObject + inputValue.substr(j);
          i += richObject.length;
          continue;
        }
      }

      i = j + 1;
    } else if (inputValue.charAt(i) === '>') {
      inputValue = inputValue.substr(0, i) + '&gt;' + inputValue.substr(i + 1);
      i += 4;
    } else if (inputValue.charAt(i) === '&') {
      inputValue = inputValue.substr(0, i) + '&amp;' + inputValue.substr(i + 1);
      i += 5;
    } else if (inputValue.charAt(i) === '<') {
      inputValue = inputValue.substr(0, i) + '&lt;' + inputValue.substr(i + 1);
      i += 4;
    } else {
      i++;
    }
  }

  return inputValue;
}

function _unescapeChatMessage(message) {
  return message
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// rich messages are arrays of objects
// each object has either a 'text', 'userId', or 'emoji' field
export function convertToRichMessage(message) {
  let items = [];
  let start = 0;
  let i = 0;

  while (i < message.length) {
    let c = message.charAt(i);

    if (c === '<') {
      if (i > start) {
        items.push({
          text: _unescapeChatMessage(message.substr(start, i - start)),
        });
      }

      let j = i + 1;
      while (message.charAt(j) !== '>' && j < message.length) {
        j++;
      }

      let tagBody = message.substr(i + 1, j - i - 1);
      if (tagBody.startsWith('user:')) {
        items.push({
          userId: tagBody.substr(5),
        });
      }

      i = j + 1;
      start = i;
    } else if (c === ':') {
      let j = i + 1;
      while (message.charAt(j) !== ':' && j < message.length) {
        j++;
      }

      let emojiBody = message.substr(i + 1, j - i - 1);
      if (isEmoji(emojiBody)) {
        if (i > start) {
          items.push({
            text: _unescapeChatMessage(message.substr(start, i - start)),
          });
        }

        items.push({
          emoji: emojiBody,
        });

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
    items.push({ text: _unescapeChatMessage(message.substr(start, i - start)) });
  }

  return items;
}
