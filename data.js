/* Sovereign Lab — versioned, editable framework definitions.
   This taxonomy is a conceptual development aid, not a validated psychometric test. */
window.SOVEREIGN_DATA = {
  version: '0.1.0',
  axes: [
    {id:'thought', name:'Thought', subtitle:'How you understand, question and create', icon:'◇'},
    {id:'action', name:'Action', subtitle:'How you turn intentions into outcomes', icon:'↗'},
    {id:'integrity', name:'Integrity', subtitle:'How you act when principles and interests intersect', icon:'✦'}
  ],
  scale: [
    {v:null,name:'Not assessed',description:'Insufficient evidence or opportunity to observe'},
    {v:0,name:'Not demonstrated',description:'Not yet demonstrated in this context; not proof of inability'},
    {v:1,name:'With guidance',description:'Demonstrates in straightforward situations with substantial guidance'},
    {v:2,name:'Independent',description:'Demonstrates independently in familiar situations'},
    {v:3,name:'Complex',description:'Demonstrates consistently in complex situations'},
    {v:4,name:'Adaptive',description:'Adapts in novel situations and can help others develop the capability'}
  ],
  capabilities: [
    {id:'comprehension',axis:'thought',name:'Comprehension',desc:'Understand and apply existing knowledge accurately.',evidence:'Explain an unfamiliar process accurately, then apply it to a real example.',practice:'Teach an unfamiliar idea in plain language and test your explanation against its source.'},
    {id:'evaluation',axis:'thought',name:'Critical evaluation',desc:'Assess claims, assumptions, evidence and competing explanations.',evidence:'Show how you tested competing explanations using verifiable evidence.',practice:'Write the strongest counterargument to your own conclusion, then list disconfirming evidence.'},
    {id:'generation',axis:'thought',name:'Idea generation',desc:'Construct alternative explanations and possible solutions.',evidence:'Provide several distinct approaches to a problem and explain their trade-offs.',practice:'Generate five materially different solutions before judging any of them.'},
    {id:'reframing',axis:'thought',name:'Problem reframing',desc:'Question whether the original problem, constraint or objective is appropriate.',evidence:'Demonstrate where changing the question uncovered a more useful solution.',practice:'Restate one problem through the perspectives of a customer, operator and skeptic.'},
    {id:'metacognition',axis:'thought',name:'Metacognition',desc:'Monitor your own thinking and select better reasoning methods.',evidence:'Describe when you changed your reasoning approach after identifying bias or missing information.',practice:'Keep a decision journal with predictions, assumptions and post-decision reviews.'},
    {id:'observation',axis:'action',name:'Observation',desc:'Notice patterns, constraints and relevant signals in real situations.',evidence:'Document patterns discovered through direct observation rather than assumptions.',practice:'Shadow a workflow and record ten observations without proposing solutions initially.'},
    {id:'execution',axis:'action',name:'Reliable execution',desc:'Deliver defined commitments to an agreed quality and standard.',evidence:'Show repeated commitments completed with expected quality and follow-through.',practice:'Plan and complete one small project with explicit acceptance criteria and a retrospective.'},
    {id:'experimentation',axis:'action',name:'Experimentation',desc:'Run bounded tests under uncertainty and adapt to evidence.',evidence:'Show a hypothesis, a test, actual results and a decision that followed.',practice:'Run a low-cost experiment with a success criterion set before the result is known.'},
    {id:'construction',axis:'action',name:'System building',desc:'Create repeatable products, processes or systems others can use.',evidence:'Demonstrate a process or product that functions reliably beyond one-off effort.',practice:'Turn a recurring task into a documented, repeatable process used by another person.'},
    {id:'transformation',axis:'action',name:'System transformation',desc:'Improve or change a wider system with enduring results.',evidence:'Show sustained changes across functions, workflows or stakeholders.',practice:'Map a cross-team constraint and test an intervention with shared ownership.'},
    {id:'honesty',axis:'integrity',name:'Honesty',desc:'Communicate truthfully, including when facts are inconvenient.',evidence:'A concrete instance of accurate disclosure despite potential disadvantage.',practice:'State uncertainties and mistakes promptly without distortion or selective omission.'},
    {id:'accountability',axis:'integrity',name:'Accountability',desc:'Own commitments, consequences, corrections and repair.',evidence:'Describe a mistake you acknowledged and the repair you completed.',practice:'After a setback, document your contribution, corrective action and follow-up.'},
    {id:'fairness',axis:'integrity',name:'Fairness',desc:'Apply consistent standards while considering relevant differences and context.',evidence:'Show a decision where you applied transparent, defensible criteria across people.',practice:'Before judging a disagreement, state the other person’s strongest legitimate case.'},
    {id:'courage',axis:'integrity',name:'Moral courage',desc:'Act on defensible principles despite pressure or personal cost.',evidence:'A documented instance of respectfully raising or addressing a difficult concern.',practice:'Practise one specific, respectful conversation you are tempted to avoid.'},
    {id:'discernment',axis:'integrity',name:'Ethical discernment',desc:'Reason through conflicts among duties, values and legitimate interests.',evidence:'Explain a difficult trade-off, whose interests were affected and why you chose as you did.',practice:'Examine a dilemma using rights, consequences, fairness and care as separate lenses.'},
    {id:'stewardship',axis:'integrity',name:'Stewardship',desc:'Consider long-term consequences, obligations and others who depend on the system.',evidence:'Demonstrate protection or improvement of shared resources beyond immediate personal gain.',practice:'Identify one downstream impact of a decision and make a responsible mitigation plan.'}
  ],
  templates: [
    {id:'dependable',name:'Dependable professional',type:'Career',description:'Reliability, sound judgment and consistent delivery', targets:{comprehension:3,evaluation:2,generation:1,reframing:1,metacognition:2,observation:2,execution:4,experimentation:1,construction:2,transformation:1,honesty:3,accountability:4,fairness:3,courage:2,discernment:2,stewardship:2}},
    {id:'specialist',name:'Deep specialist',type:'Career',description:'Deep expertise, professional judgment and quality', targets:{comprehension:4,evaluation:4,generation:2,reframing:2,metacognition:3,observation:3,execution:4,experimentation:2,construction:2,transformation:1,honesty:3,accountability:4,fairness:3,courage:2,discernment:3,stewardship:2}},
    {id:'founder',name:'Entrepreneurial builder',type:'Aspiration',description:'Discover opportunities, validate ideas and build repeatable businesses', targets:{comprehension:3,evaluation:4,generation:4,reframing:4,metacognition:4,observation:4,execution:3,experimentation:4,construction:4,transformation:3,honesty:3,accountability:4,fairness:3,courage:4,discernment:3,stewardship:3}},
    {id:'leader',name:'Organizational leader',type:'Career',description:'Lead people, make decisions and build lasting systems', targets:{comprehension:3,evaluation:4,generation:3,reframing:3,metacognition:4,observation:3,execution:3,experimentation:3,construction:4,transformation:4,honesty:4,accountability:4,fairness:4,courage:4,discernment:4,stewardship:4}},
    {id:'innovator',name:'Innovation practitioner',type:'Career',description:'Investigate unmet needs, reframe and test solutions', targets:{comprehension:3,evaluation:4,generation:4,reframing:4,metacognition:3,observation:4,execution:2,experimentation:4,construction:3,transformation:2,honesty:3,accountability:3,fairness:3,courage:3,discernment:3,stewardship:2}}
  ],
  reflections:[
    {id:'freedom',name:'Inner freedom',question:'Which ambitions would still matter if no one ever applauded the outcome?',prompt:'What can I value about myself independently of achievement or approval?'},
    {id:'meaning',name:'Meaning & alignment',question:'Where do my everyday choices reflect — or contradict — what I say matters?',prompt:'What responsibility or activity feels worthwhile even when difficult?'},
    {id:'relationships',name:'Relationships & belonging',question:'Where am I giving and receiving genuine care?',prompt:'Which relationships deserve more attention, honesty or presence?'},
    {id:'contentment',name:'Contentment & enjoyment',question:'What in my life is worth enjoying without optimizing?',prompt:'When is my acceptance genuine, and when might it be avoidance?'}
  ]
};
