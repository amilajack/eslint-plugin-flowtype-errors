/**
 * This module is responsible for formatting flowtype errors to be more friendly and understandable
 * Formatting should be disabled by default
 * @TODO
 */

function fomatMessage(description) {
  if (description.toLowerCase().includes("' This type")) {
    return description.replace('This type', 'type');
  }

  return description;
}

export default function filter(messages) {
  return messages
    .map(e => ({
      ...e,
      message: fomatMessage(e.message)
    }));
}
