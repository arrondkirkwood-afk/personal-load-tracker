Redesign work is isolated to the agent/load-tracker-ui-redesign branch.

Safety rules for this branch:
- Keep main unchanged until review.
- Do not change Firebase collection paths, localStorage keys, load record IDs, pay formulas, or migration behavior as part of UI work.
- Keep the original style.css intact; place visual overrides in redesign.css while the redesign is being evaluated.
- Run the existing regression suite and tests/redesign-contract.test.js before any merge.
