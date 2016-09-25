/**
 * This module is responsible for filtering out errors that are 'turned off' by ESLint
 *
 * Filtering should be disabled by default. Ideally, this kind of feature would be
 * handled by Flow. Note that this is a temporary solution.
 *
 * @TODO
 */

function determineRuleType(description) {
  if (description.toLowerCase().includes('missing annotation')) {
    return 'missing-annotation';
  }

  return 'default';
}

export default function filter(messages) {
  return messages
    .filter(e => (e !== false && e !== 'false'))
    .map(e => ({
      ...e,
      type: determineRuleType(e.message)
    }));
}
