/* Organization review module is activated after Google Workspace and Firestore setup. */
window.SOVEREIGN_ORG={render(){return '<div class="portal-hero"><h1 class="headline">Organization <em>workspace.</em></h1><div class="notice">The organizational review workflow is being connected. No employee data is exposed until an authorized membership is verified.</div></div>'}};
window.dispatchEvent(new CustomEvent('sovereign-org-change'));
