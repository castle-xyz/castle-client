import { Value } from 'slate';
import Plain from 'slate-plain-serializer';

export const isMaybeCastleURL = (query) => {
  if (isEmpty(query)) {
    return false;
  }

  query = query.slice(0).trim();
  return (
    query.endsWith('.lua') ||
    query.startsWith('castle:') ||
    query.startsWith('http') ||
    query.startsWith('file://')
  );
};

export const elide = (string, length = 140) => {
  if (isEmpty(string)) {
    return '...';
  }

  if (string.length < length) {
    return string.trim();
  }

  return `${string.substring(0, length)}...`;
};

export const toDirectoryName = (str) => {
  if (str) {
    return str
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '-');
  }
  return null;
};

export const toDate = (dateString) => {
  let date = dateString;
  if (typeof dateString !== 'object') {
    date = new Date(dateString);
  }

  return `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`;
};

export const isEmpty = (string) => {
  return !string || string.length === 0;
};

export const pluralize = (text, count) => {
  return count > 1 || count === 0 ? `${text}s` : text;
};

export const loadEditor = (text) => {
  // NOTE(jim): Its not clear to me when something decides to be a string.
  if (typeof text === 'string') {
    const parsedText = JSON.parse(text);
    if (typeof parsedText === 'object') {
      return Value.fromJSON(parsedText);
    }

    throw new Error('Text parsing failed. Critical error');
  }

  return Value.fromJSON(text);
};

export const isRichTextEmpty = (val) => {
  return !val || !Value.isValue(val) || val.document.text.length == 0;
};
