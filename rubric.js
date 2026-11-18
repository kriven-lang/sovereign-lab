/* Observable proficiency anchors shared by personal and organization assessments. */
(function () {
  'use strict';

  const behaviors = {
    comprehension: [
      'Misses key steps when explaining a process',
      'Explains and applies a process with guidance',
      'Explains and applies a familiar process independently',
      'Applies related concepts to complex cases',
      'Adapts concepts to new cases and explains how'
    ],
    evaluation: [
      'Accepts a claim without checking its support',
      'Checks a claim against a source with guidance',
      'Weighs sources and alternatives independently',
      'Tests competing claims against conflicting evidence',
      'Builds a reliable check for unfamiliar claims'
    ],
    generation: [
      'Returns to one approach when alternatives are needed',
      'Suggests another approach with prompting',
      'Produces distinct options and names their trade-offs',
      'Develops viable options under competing constraints',
      'Combines ideas into useful approaches for new problems'
    ],
    reframing: [
      'Works from the initial question without checking it',
      'Restates the question from a prompted perspective',
      'Changes the question when an assumption fails',
      'Tests different problem frames across stakeholders',
      'Introduces a frame that opens a new path to action'
    ],
    metacognition: [
      'Repeats a reasoning approach despite contrary evidence',
      'Identifies an assumption with guided reflection',
      'Checks assumptions and adjusts reasoning independently',
      'Changes reasoning methods under mixed evidence',
      'Designs new checks and helps others test their reasoning'
    ],
    observation: [
      'Reports impressions without checking what happened',
      'Records relevant details using a guided checklist',
      'Separates observations from inferences in routine work',
      'Corroborates patterns across complex situations',
      'Finds and verifies new signals in unfamiliar situations'
    ],
    execution: [
      'Misses agreed requirements or follow-through',
      'Meets agreed requirements with regular guidance',
      'Delivers routine commitments to the agreed standard',
      'Delivers reliably as dependencies and priorities shift',
      'Adapts delivery methods and helps others use them'
    ],
    experimentation: [
      'Makes a change without defining what to measure',
      'Runs a guided test with a stated success measure',
      'Runs a bounded test and acts on its results',
      'Designs a test that separates competing explanations',
      'Adapts test design when standard methods cannot work'
    ],
    construction: [
      'Relies on one-off work for a recurring task',
      'Documents a repeatable process with guidance',
      'Builds a process another person can run unaided',
      'Builds in recovery and handoffs for complex work',
      'Adapts the system and enables others to maintain it'
    ],
    transformation: [
      'Improves a local task while the wider issue recurs',
      'Supports a shared change with guided responsibilities',
      'Implements a shared improvement and tracks adoption',
      'Coordinates change across teams and sustains results',
      'Adapts the change and enables others to sustain it'
    ],
    honesty: [
      'Leaves a material inaccuracy uncorrected',
      'Corrects an inaccurate statement when prompted',
      'Discloses relevant mistakes or uncertainty promptly',
      'Discloses verified facts despite pressure to omit them',
      'Makes responsible disclosure easier in new situations'
    ],
    accountability: [
      'Leaves an agreed responsibility or correction unresolved',
      'Acknowledges an error and repairs it with guidance',
      'Owns an error, repairs it and follows up independently',
      'Coordinates repair and follow-up across shared ownership',
      'Improves how others detect and repair new failures'
    ],
    fairness: [
      'Applies different criteria without a relevant reason',
      'Uses agreed criteria and checks exceptions with guidance',
      'Applies stated criteria and explains relevant differences',
      'Tests decisions for unequal effects and corrects gaps',
      'Adapts criteria transparently and checks new inequities'
    ],
    courage: [
      'Leaves a known concern unraised when a safe route exists',
      'Raises a specific concern with support',
      'Raises a specific concern through an appropriate route',
      'Addresses a concern despite pressure and follows up',
      'Finds a safe route for a novel concern and supports others'
    ],
    discernment: [
      'Acts on one priority without checking competing duties',
      'Identifies affected people and duties with guidance',
      'Weighs competing duties and explains a reasoned decision',
      'Resolves a difficult trade-off and mitigates foreseeable harm',
      'Develops a defensible approach for a novel dilemma'
    ],
    stewardship: [
      'Leaves a foreseeable downstream cost unaddressed',
      'Identifies a downstream cost and acts with guidance',
      'Protects shared resources and checks downstream effects',
      'Balances competing long-term needs and verifies impacts',
      'Adapts safeguards for new risks and transfers ownership'
    ]
  };

  const guidance = {
    comprehension: 'Look for an accurate explanation and a correct application. Note how much guidance the person needed.',
    evaluation: 'Identify the claim, which sources were checked, and what evidence changed the conclusion.',
    generation: 'Look for several distinct approaches. Note how the person used the constraints to choose which idea to pursue.',
    reframing: 'Write down the original framing and what changed. Look for a new framing that led to a different option.',
    metacognition: 'Describe an assumption or thinking habit the person noticed, then record what they changed in response.',
    observation: 'Separate what the person saw or measured from the explanation they inferred. Include the pattern they checked.',
    execution: 'Name the commitment, the obstacles, and the delivered result. Record any support that was needed.',
    experimentation: 'Record the question, the test, and what the result changed. A test can be valuable even when the idea fails.',
    construction: 'Describe what was built, who used it, and how it was checked against their needs.',
    transformation: 'Compare the situation before and after the change. Look for evidence that people adopted it and that it held up.',
    honesty: 'Focus on an observable action such as correcting an error or communicating uncertainty. Include the context.',
    accountability: 'Identify the commitment and what the person did to communicate, repair, or prevent a missed outcome.',
    fairness: 'Identify who was affected, which criteria were applied, and how exceptions were explained.',
    courage: 'Record a specific concern, the route available for raising it, and what follow-up occurred. Consider whether it was safe to act.',
    discernment: 'Name the competing responsibilities and who was affected. Explain the reasoning and the trade-off chosen.',
    stewardship: 'Name the shared resource or responsibility and who would bear the downstream cost. Look for evidence that it was protected over time.'
  };

  const escape = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  function level(score) {
    if (typeof score === 'string' && /^[0-4]$/.test(score)) score = Number(score);
    return Number.isInteger(score) && score >= 0 && score <= 4 ? score + 1 : null;
  }

  function label(id, score) {
    const display = level(score);
    if (display === null) return 'Not assessed';
    const description = Object.hasOwn(behaviors, id) ? behaviors[id][display - 1] : '';
    return description ? `${display} · ${description}` : String(display);
  }

  function options(id, current) {
    const selected = level(current);
    return `<option value=""${selected === null ? ' selected' : ''}>Not assessed</option>` +
      [0, 1, 2, 3, 4].map(score =>
        `<option value="${score}"${selected === score + 1 ? ' selected' : ''}>${escape(label(id, score))}</option>`
      ).join('');
  }

  function help(id, prefix) {
    const capability = window.SOVEREIGN_DATA?.capabilities.find(item => item.id === id);
    if (!capability) return '';
    const panelId = escape(`${prefix}-${id}-help`);
    const name = escape(capability.name);
    return `<details class="capability-help"><summary class="capability-help-trigger" aria-label="About ${name}" aria-controls="${panelId}">` +
      '<span aria-hidden="true">i</span></summary>' +
      `<div class="capability-help-popover" id="${panelId}"><strong class="capability-help-title">${name}</strong>` +
      `<p>${escape(capability.desc)}</p><p>${escape(guidance[id])}</p></div></details>`;
  }

  window.SOVEREIGN_RUBRIC = { level, label, options, help };
})();
