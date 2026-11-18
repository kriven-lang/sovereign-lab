/* Evidence-based summaries and practice suggestions for the personal workspace. */
(function () {
  'use strict';

  const data = window.SOVEREIGN_DATA;
  const rubric = window.SOVEREIGN_RUBRIC;

  const exercises = {
    comprehension: {
      minutes: 15,
      routine: 'Choose a process you need to use. Explain it in plain language, then apply it to a new example and check your work against the source.',
      hobby: 'Learn one technique, then teach it to a beginner or write a short guide from memory. Test whether someone could follow it.',
      examples: 'a recipe, a musical technique, or a game rule',
      evidence: 'An explanation, a worked example, and one change you made after checking the source.'
    },
    evaluation: {
      minutes: 15,
      routine: 'Pick a claim behind a decision. Find one source that supports it and one that challenges it. State what would change your view.',
      hobby: 'Compare two competing tutorials or recommendations. Choose a small check that could distinguish between their claims.',
      examples: 'a gear recommendation, a sports tactic, or a cooking tip',
      evidence: 'The claim, the most relevant source on each side, and the conclusion you reached.'
    },
    generation: {
      minutes: 10,
      routine: 'Take a small problem and sketch three approaches that use different methods. Choose one to try and state why it fits the constraints.',
      hobby: 'Make three variations of a familiar project by changing one constraint, such as time, materials, or audience.',
      examples: 'three photo compositions, recipe variations, or sketch concepts',
      evidence: 'Three distinct options and one trade-off that helped you choose.'
    },
    reframing: {
      minutes: 15,
      routine: 'Write a recurring problem from the perspective of the person affected and the person doing the work. Test one revised question in a conversation or small action.',
      hobby: 'When you get stuck, rewrite the goal around a different outcome. Try one response to the new goal and compare it with your usual approach.',
      examples: 'a difficult puzzle, a craft project, or a stalled training routine',
      evidence: 'The original question, the new question, and the option it opened.'
    },
    metacognition: {
      minutes: 10,
      routine: 'Before a decision, write what you expect, why, and one assumption. After the outcome, identify one change to your reasoning for next time.',
      hobby: 'Predict which part of your next session will be hardest. Compare the prediction with what happened and adjust how you prepare next time.',
      examples: 'music practice, fitness training, or a strategy game',
      evidence: 'One prediction, what happened, and the reasoning habit you will test next.'
    },
    observation: {
      minutes: 15,
      routine: 'Watch a recurring task and write five observable details. Mark which patterns are still guesses and verify one against a second example.',
      hobby: 'Observe two short sessions or examples. Separate what you can see or measure from what you think caused it.',
      examples: 'birdwatching, reviewing game footage, or comparing garden growth',
      evidence: 'A list of observations and a pattern you checked in a second instance.'
    },
    execution: {
      minutes: 10,
      routine: 'Set a finish time and two acceptance criteria for one small deliverable. Check the finished work and record any missed criterion.',
      hobby: 'Choose one modest project you can finish this week. Define what done means and schedule a short session to complete it.',
      examples: 'repairing a small item, finishing a sketch, or preparing a meal',
      evidence: 'The agreed result, when you delivered it, and how it met the criteria.'
    },
    experimentation: {
      minutes: 15,
      routine: 'For one uncertain improvement, set a success measure before testing. Change one thing in a reversible trial, then decide what the result supports.',
      hobby: 'Change one variable in your next session and compare it with your usual method using the same measure.',
      examples: 'a baking adjustment, a new exercise setup, or a different practice tempo',
      evidence: 'A prediction, the comparison you ran, the result, and what you will try next.'
    },
    construction: {
      minutes: 20,
      routine: 'Turn a repeated task into a short checklist with inputs, steps, and a quality check. Ask a willing colleague or peer to try it and note where they pause.',
      hobby: 'Create a reusable setup or checklist. Try it in your next session and revise the step that costs the most time.',
      examples: 'a workshop setup, a camping checklist, or a recipe template',
      evidence: 'A checklist someone can follow and a change based on an actual run.'
    },
    transformation: {
      minutes: 20,
      routine: 'Map a recurring handoff involving two people or groups. Agree on one reversible change, who will own it, and a measure to review after a week.',
      hobby: 'With a willing group, simplify one recurring handoff such as scheduling, equipment setup, or cleanup. Review after two sessions.',
      examples: 'a sports club, a volunteer group, or a shared creative project',
      evidence: 'The original bottleneck, the agreed change, and whether the people involved kept using it.'
    },
    honesty: {
      minutes: 10,
      routine: 'In your next update, identify one uncertain claim or prior error. State the verified facts, what remains uncertain, and how you will check or correct it.',
      hobby: 'Review a session or project against a previous prediction. Keep one accurate record of what worked, what did not, and what you cannot yet tell.',
      examples: 'a training log, a photo edit, or a practice recording',
      evidence: 'The wording of a factual correction or uncertainty, with relevant identifying details removed.'
    },
    accountability: {
      minutes: 10,
      routine: 'Identify one commitment that may slip. State who needs an update, what you can repair, and when you will confirm the result.',
      hobby: 'When a shared commitment slips, agree on one repair and a check-in. For a solo hobby, review a delayed goal and adjust one action within your control.',
      examples: 'a delayed contribution to a club or an unfinished repair',
      evidence: 'The action you owned, the repair or update you made, and the follow-up.'
    },
    fairness: {
      minutes: 15,
      routine: 'For a low-stakes allocation or scheduling decision, write criteria in advance. Check whether a relevant circumstance needs an exception and explain your reasoning.',
      hobby: 'Set clear rules for sharing turns, materials, or playing time. Ask a willing participant whether the rules work for different needs.',
      examples: 'a board game night, a book club, or a shared practice space',
      evidence: 'The criteria, a relevant difference you considered, and what you changed or kept.'
    },
    courage: {
      minutes: 10,
      routine: 'Rehearse raising a low-stakes issue with a trusted person. Describe the facts, likely impact, and a safe way to ask for follow-up.',
      hobby: 'Practice giving respectful feedback about a small group problem. Ask a willing peer to help you make the concern specific and constructive.',
      examples: 'a rehearsal group, a club, or a shared workspace',
      evidence: 'The factual concern, the safe route you considered, and a follow-up you can control.'
    },
    discernment: {
      minutes: 15,
      routine: 'Write down a decision with two competing obligations. Identify who is affected and one way to reduce the cost of your choice.',
      hobby: 'When keeping a commitment conflicts with someone’s needs, compare two feasible responses and explain the trade-off you would accept.',
      examples: 'choosing competition rules or handling a conflicting group commitment',
      evidence: 'The two obligations, the affected people, and the trade-off and safeguard you chose.'
    },
    stewardship: {
      minutes: 15,
      routine: 'Pick one shared resource or process. Track how a small safeguard affects the people who will use or maintain it next week.',
      hobby: 'Make one maintenance or reuse plan for a shared resource. Test whether the plan is easy for the next person to follow.',
      examples: 'shared tools, garden materials, or borrowed equipment',
      evidence: 'The resource, the change you made, and a downstream effect you can check.'
    }
  };

  const clean = value => typeof value === 'string' ? value.trim() : '';
  const escape = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const context = (...values) => [...new Set(values.map(clean).filter(Boolean))].join(' · ');
  const setting = profile => context(profile?.role, profile?.responsibilities);
  const direction = profile => context(profile?.targetRole, profile?.targetContext);
  const preference = value => value >= 1 && value <= 5 ? Number(value) : 3;

  function list(items, entry, fallback) {
    if (!items.length) return `<p>${fallback}</p>`;
    return '<ul class="insight-list">' + items.map(item => `<li>${entry(item)}</li>`).join('') + '</ul>';
  }

  function summary(assessments, targets, profile) {
    const entries = data.capabilities.map(capability => {
      const record = assessments?.[capability.id];
      const level = rubric.level(record?.current);
      const storedTarget = targets?.[capability.id];
      const target = rubric.level(storedTarget);
      const prioritizedTarget = target > 1 ? target : null;
      const gap = level !== null && prioritizedTarget !== null ? Math.max(0, prioritizedTarget - level) : 0;
      const priority = gap * (0.5 + preference(record?.importance) / 5) * (0.5 + preference(record?.motivation) / 5);
      return {
        capability, level, target: prioritizedTarget, gap, priority,
        choice: record?.current, hasEvidence: Boolean(clean(record?.evidence))
      };
    });
    const rated = entries.filter(entry => entry.level !== null);
    const supported = rated.filter(entry => entry.hasEvidence);
    const strengths = supported.filter(entry => entry.level >= 4).sort((a, b) => b.level - a.level);
    const gaps = supported.filter(entry => entry.gap > 0).sort((a, b) => b.priority - a.priority || b.gap - a.gap);
    const pending = entries.filter(entry => entry.target !== null && (entry.level === null || !entry.hasEvidence));
    const current = setting(profile);
    const target = direction(profile);

    return `<section class="insight-summary" aria-label="Assessment insights">
      <h3>What your assessment shows</h3>
      <p>${rated.length} of ${entries.length} capabilities rated · ${supported.length} ratings with evidence · ${entries.length - rated.length} unassessed.</p>
      ${current || target ? `<p class="insight-context">${current ? `Practice setting · <strong>${escape(current)}</strong>` : ''}${current && target ? '<br>' : ''}${target ? `Target direction · <strong>${escape(target)}</strong>` : ''}</p>` : ''}
      <div class="insight-grid">
        <div><h4>Evidence-backed strengths (${strengths.length})</h4>${list(strengths.slice(0, 3), entry =>
          `<strong>${escape(entry.capability.name)}</strong><span>Level ${escape(rubric.label(entry.capability.id, entry.choice))}</span>`, 'Level 4 or 5 ratings appear here when you add an example.')}</div>
        <div><h4>Observed development priorities (${gaps.length})</h4>${list(gaps.slice(0, 3), entry =>
          `<strong>${escape(entry.capability.name)}</strong><span>Level ${entry.level} → target ${entry.target} · ${entry.gap} ${entry.gap === 1 ? 'level' : 'levels'} to build</span>`, 'Priorities appear when a rating with evidence is below an active target.')}</div>
        <div><h4>Targets needing observation (${pending.length})</h4>${list(pending.slice(0, 3), entry =>
          `<strong>${escape(entry.capability.name)}</strong><span>${entry.level === null ? 'Unassessed' : 'Add an example'}</span>`, 'Each active target has an assessment and an example.')}</div>
      </div>
      ${gaps.length ? `<p>Start with one practice for <strong>${escape(gaps[0].capability.name)}</strong>. Repeat it next week and record what changed.</p>` : ''}
    </section>`;
  }

  function activities(capability, profile) {
    const id = typeof capability === 'string' ? capability : capability?.id;
    if (!Object.hasOwn(exercises, id)) return '';
    const exercise = exercises[id];
    const current = setting(profile);
    const target = direction(profile);
    const hobbies = clean(profile?.hobbies);
    return `<section class="insight-activities" aria-label="Practice activities">
      <div class="insight-activity"><strong>Try it in your routine · ${exercise.minutes} min</strong>
        ${current ? `<p class="insight-context">Practice setting · ${escape(current)}</p>` : ''}<p>${exercise.routine}</p></div>
      <div class="insight-activity"><strong>Try it through a hobby</strong>
        <p class="insight-context">${hobbies ? `Use an interest you listed · ${escape(hobbies)}` : `Possible starting points · ${exercise.examples}`}</p><p>${exercise.hobby}</p></div>
      <p><strong>Evidence to record</strong> ${exercise.evidence}</p>
      ${target ? `<p><strong>Apply it to ${escape(target)}</strong> Choose one related situation in that setting and try the version that fits your responsibilities. Compare the result with your first attempt.</p>` : ''}
    </section>`;
  }

  window.SOVEREIGN_INSIGHTS = { summary, activities };
})();
