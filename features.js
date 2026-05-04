// initialize firebase
const firebaseConfig = {
    apiKey: "AIzaSyDy8cbOjgsjg8ssxRbL-CTWFDBVMCcSaHM",
    authDomain: "artcrime-fe03f.firebaseapp.com",
    databaseURL: "https://artcrime-fe03f-default-rtdb.firebaseio.com",
    projectId: "artcrime-fe03f",
    storageBucket: "artcrime-fe03f.firebasestorage.app",
    messagingSenderId: "144968287696",
    appId: "1:144968287696:web:a414d86cef3ad86c5425d5",
    measurementId: "G-EXFD5B6PFT"
};


firebase.initializeApp(firebaseConfig);
const db = firebase.database();


// voting logic - users can only vote once per monument,
// and their choice is stored in localStorage to stay across sessions.
// votes are sent to firebase and the UI updates in real-time as votes come in from all users.
// the vote buttons are disabled after voting, and a message shows the user's choice.
// if they try to vote again, it reminds them of their prior vote.


// function that handles when a user clicks a vote button, takes the monument ID and the vote type ('remove' or 'keep')
function castVote(monumentId, vote) {
    const storageKey = `voted_${monumentId}`;

    // check if the user has already voted on this monument by looking in localStorage
    if (localStorage.getItem(storageKey)) {
        showAlreadyVoted(monumentId);
        return;
    }

    // if not, update the vote count in firebase using a transaction to ensure atomic updates
    const ref = db.ref(`votes/${monumentId}/${vote}`);
    ref.transaction(current => (current || 0) + 1);

    // store the user's vote in localStorage so we can remember it across sessions
    localStorage.setItem(storageKey, vote);

    // update the UI to reflect that the user has voted and disable the buttons
    lockVoteUI(monumentId, vote);
}

// function that listens for changes to the vote counts for a given monument and updates the UI accordingly
function listenToVotes(monumentId) {

    // listen to the 'votes/{monumentId}' path in firebase for changes
    db.ref(`votes/${monumentId}`).on('value', snapshot => {
        const data = snapshot.val() || {};
        const removeCount = data.remove || 0;
        const keepCount   = data.keep   || 0;
        const total       = removeCount + keepCount;

        // get references to the elements in the UI that show the counts and the bars for each option
        const removeEl  = document.getElementById(`count-remove-${monumentId}`);
        const keepEl    = document.getElementById(`count-keep-${monumentId}`);
        const barRemove = document.getElementById(`bar-remove-${monumentId}`);
        const barKeep   = document.getElementById(`bar-keep-${monumentId}`);

        // update the text counts for each option
        if (removeEl) removeEl.textContent = removeCount;
        if (keepEl)   keepEl.textContent   = keepCount;

        // update the width of the bars to reflect the percentage of votes for each option
        if (total > 0) {
            if (barRemove) barRemove.style.width = `${Math.round((removeCount / total) * 100)}%`;
            if (barKeep)   barKeep.style.width   = `${Math.round((keepCount   / total) * 100)}%`;
        }
    });
}

// function that updates the UI to show that the user has voted and disables the buttons to prevent multiple votes
function lockVoteUI(monumentId, chosenVote) {

    // find the container for this monument's vote widget
    const container = document.getElementById(`vote-${monumentId}`);
    if (!container) return;

    // disable the buttons and show a message thanking the user for their vote
    const btnRemove = container.querySelector('.vote-btn-remove');
    const btnKeep   = container.querySelector('.vote-btn-keep');
    const thanks    = container.querySelector('.vote-thanks');
    const label     = chosenVote === 'remove' ? 'Take it down' : 'Keep it up';

    // disable the buttons so they can't vote again
    if (btnRemove) btnRemove.disabled = true;
    if (btnKeep)   btnKeep.disabled   = true;
    if (thanks) {
        thanks.textContent = `You voted: "${label}"`;
        thanks.style.display = 'block';
    }

    // add a class to the chosen button to visually indicate the user's choice
    const chosen = container.querySelector(`.vote-btn-${chosenVote}`);
    if (chosen) chosen.classList.add('voted');
}

// function that shows a message if the user tries to vote again, reminding them of their prior vote
function showAlreadyVoted(monumentId) {

    // find the container for this monument's vote widget
    const container = document.getElementById(`vote-${monumentId}`);
    if (!container) return;

    // get the prior vote from localStorage and show a message reminding the user of their choice
    const thanks = container.querySelector('.vote-thanks');
    const prior  = localStorage.getItem(`voted_${monumentId}`);
    const label  = prior === 'remove' ? 'Take it down' : 'Keep it up';

    // show a message reminding the user of their prior vote
    if (thanks) {
        thanks.textContent = `You already voted: "${label}"`;
        thanks.style.display = 'block';
    }
}

// when the page loads, set up the vote listeners for each monument and check if the user has already voted to update the UI accordingly
document.addEventListener('DOMContentLoaded', () => {

    // for each monument ID, set up the vote listeners and check localStorage for prior votes to update the UI
    ['leopold', 'auschwitz', 'lincoln'].forEach(id => {
        const widget = document.getElementById(`vote-${id}`);

        // if the vote widget exists on the page, set up the listener for vote changes and check if the user has already voted to update the UI
        if (widget) {
            listenToVotes(id);
            const prior = localStorage.getItem(`voted_${id}`);
            if (prior) lockVoteUI(id, prior);
        }
        // if the monument also has a card element on the page, set up a listener for the card's vote counts and check localStorage for prior votes to update the card UI
        const card = document.getElementById(`card-vote-${id}`);
        if (card) {
            listenToCardVotes(id);
            const prior = localStorage.getItem(`voted_${id}`);
            if (prior) updateCardUI(id);
        }
    });
});

// additional functions for the card elements, which also show the current vote counts but in a more compact format.
// these listen to the same firebase data but update different elements in the UI.
function listenToCardVotes(monumentId) {

    // listen to the 'votes/{monumentId}' path in firebase for changes to update the counts on the card UI
    db.ref(`votes/${monumentId}`).on('value', snapshot => {
        const data = snapshot.val() || {};
        const removeCount = data.remove || 0;
        const keepCount   = data.keep   || 0;

        // get references to the elements in the card UI that show the counts for each option
        const removeEl = document.getElementById(`card-count-remove-${monumentId}`);
        const keepEl   = document.getElementById(`card-count-keep-${monumentId}`);

        // update the text counts for each option on the card
        if (removeEl) removeEl.textContent = removeCount;
        if (keepEl)   keepEl.textContent   = keepCount;
    });
}

// function that updates the card UI to show that the user has voted and disables the buttons on the card as well
function updateCardUI(monumentId) {

    // get the user's prior vote from localStorage
    const prior = localStorage.getItem(`voted_${monumentId}`);
    if (!prior) return;

    // disable the buttons on the card to prevent multiple votes
    const removeBtn = document.getElementById(`cv-remove-${monumentId}`);
    const keepBtn   = document.getElementById(`cv-keep-${monumentId}`);
    if (removeBtn) removeBtn.disabled = true;
    if (keepBtn)   keepBtn.disabled   = true;

    // add a class to the chosen button on the card to visually indicate the user's choice
    const chosen = document.getElementById(`cv-${prior}-${monumentId}`);
    if (chosen) chosen.classList.add('voted');
}