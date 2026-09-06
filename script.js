// ========================================
// FOUNDLY - FIREBASE + REAL LEADERBOARD
// ========================================


// ========================================
// FIREBASE IMPORTS
// ========================================

import {
    initializeApp
} from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";


import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";


import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    increment,
    runTransaction
} from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// ========================================
// FIREBASE CONFIG
// ========================================

const firebaseConfig = {

    apiKey:
        "AIzaSyDaVaQJOCPqqNkYAc-Vlfu1szEF0ipnnlk",

    authDomain:
        "foundly-b0d82.firebaseapp.com",

    projectId:
        "foundly-b0d82",

    storageBucket:
        "foundly-b0d82.firebasestorage.app",

    messagingSenderId:
        "551566138613",

    appId:
        "1:551566138613:web:d193290c4862cb0e39f9bc",

    measurementId:
        "G-99DT842GW1"

};


// ========================================
// INITIALIZE FIREBASE
// ========================================

const app =
    initializeApp(firebaseConfig);


const auth =
    getAuth(app);


const db =
    getFirestore(app);


const provider =
    new GoogleAuthProvider();


// ========================================
// APP STATE
// ========================================

let items = [];

let users = [];

let currentType =
    "Lost";

let currentFilter =
    "All";

let currentUser =
    null;

// Currently open item details (keeps owner view in sync)
let openDetailsId =
    null;


// ========================================
// GOOGLE LOGIN
// ========================================

async function login() {

    try {

        await signInWithPopup(
            auth,
            provider
        );

    }

    catch (error) {

        console.error(error);

        showToast(
            "❌ Login failed: " +
            error.message
        );

    }

}


// ========================================
// LOGOUT
// ========================================

async function logout() {

    try {

        await signOut(auth);

        showToast(
            "Logged out successfully!"
        );

    }

    catch (error) {

        console.error(error);

        showToast(
            "❌ Logout failed"
        );

    }

}


// ========================================
// CREATE / UPDATE USER PROFILE
// ========================================

async function createUserProfile(user) {

    if (!user) return;


    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        const userSnap =
            await getDoc(userRef);


        if (!userSnap.exists()) {

            await setDoc(

                userRef,

                {

                    name:
                        user.displayName ||
                        "Campus User",

                    email:
                        user.email ||
                        "",

                    points:
                        0,

                    resolvedCount:
                        0,

                    createdAt:
                        serverTimestamp()

                }

            );

        }

        else {

            await updateDoc(

                userRef,

                {

                    name:
                        user.displayName ||
                        "Campus User",

                    email:
                        user.email ||
                        ""

                }

            );

        }

    }

    catch (error) {

        console.error(
            "User profile error:",
            error
        );

    }

}


// ========================================
// AUTH STATE
// ========================================

onAuthStateChanged(

    auth,

    async (user) => {

        if (user) {

            currentUser =
                user;


            await createUserProfile(
                user
            );


            document
                .getElementById(
                    "loginPage"
                )
                .style.display =
                "none";


            document
                .getElementById(
                    "appPage"
                )
                .style.display =
                "flex";


            updateUserUI(
                user
            );


            renderMyPosts();

            renderLeaderboard();


            showToast(

                "Welcome, " +

                (
                    user.displayName ||
                    "Campus User"
                ) +

                "! 👋"

            );

        }

        else {

            currentUser =
                null;


            document
                .getElementById(
                    "appPage"
                )
                .style.display =
                "none";


            document
                .getElementById(
                    "loginPage"
                )
                .style.display =
                "flex";

        }

    }

);


// ========================================
// UPDATE USER UI
// ========================================

function updateUserUI(user) {

    const name =

        user.displayName ||

        "Campus User";


    const avatar =

        name
            .charAt(0)
            .toUpperCase();


    const avatarElement =

        document.querySelector(
            ".sidebar .user-avatar"
        );


    const nameElement =

        document.querySelector(
            ".user-card b"
        );


    if (avatarElement) {

        avatarElement.innerText =
            avatar;

    }


    if (nameElement) {

        nameElement.innerText =
            name;

    }


    updateMyPoints();

}


// ========================================
// UPDATE MY POINTS
// ========================================

function updateMyPoints() {

    if (!currentUser) return;


    const userData =

        users.find(

            user =>

                user.id ===
                currentUser.uid

        );


    const points =

        userData

            ? (
                userData.points ||
                0
            )

            : 0;


    // SIDEBAR POINTS

    const sidebarPoints =

        document.getElementById(
            "userPoints"
        );


    if (sidebarPoints) {

        sidebarPoints.innerText =
            points;

    }


    // LEADERBOARD "YOUR PROGRESS"

    const leaderboardPoints =

        document.getElementById(
            "leaderboardUserPoints"
        );


    if (leaderboardPoints) {

        leaderboardPoints.innerText =
            points;

    }

}


// ========================================
// LOAD USERS
// REALTIME LEADERBOARD
// ========================================

const usersQuery =

    query(

        collection(
            db,
            "users"
        ),

        orderBy(
            "points",
            "desc"
        )

    );


onSnapshot(

    usersQuery,

    (snapshot) => {

        users =

            snapshot.docs.map(

                document => ({

                    id:
                        document.id,

                    ...document.data()

                })

            );


        renderLeaderboard();

        updateMyPoints();

        updateStats();

    },

    (error) => {

        console.error(
            "Leaderboard error:",
            error
        );

    }

);


// ========================================
// LOAD ITEMS
// ========================================

const itemsQuery =

    query(

        collection(
            db,
            "items"
        ),

        orderBy(
            "createdAt",
            "asc"
        )

    );


onSnapshot(

    itemsQuery,

    (snapshot) => {

        items =

            snapshot.docs.map(

                document => ({

                    id:
                        document.id,

                    ...document.data()

                })

            );


        renderRecentItems();

        renderBrowseItems();

        renderMyPosts();

        updateStats();

        // Keep an already-open details modal synced in real time.
        if (openDetailsId) {

            const detailsModal =
                document.getElementById(
                    "detailsModal"
                );

            if (
                detailsModal &&
                detailsModal.style.display === "flex"
            ) {

                openDetails(
                    openDetailsId
                );

            }

        }

    },

    (error) => {

        console.error(
            "Firestore error:",
            error
        );

    }

);


// ========================================
// UPDATE HOME STATS
// ========================================

function updateStats() {

    const returnedCount =

        document.getElementById(
            "returnedCount"
        );


    const communityCount =

        document.getElementById(
            "communityCount"
        );


    if (returnedCount) {

        returnedCount.innerText =

            items.filter(

                item =>

                    item.status ===
                    "Resolved"

            ).length;

    }


    if (communityCount) {

        communityCount.innerText =

            users.filter(

                user =>

                    (
                        user.points ||
                        0
                    ) > 0

            ).length;

    }

}


// ========================================
// REAL LEADERBOARD
// ========================================

function renderLeaderboard() {

    const container =

        document.getElementById(
            "leaderboardContent"
        );


    if (!container) return;


    const helpers =

        users.filter(

            user =>

                (
                    user.points ||
                    0
                ) > 0

        );


    if (helpers.length === 0) {

        container.className =
            "leaderboard-empty";


        container.innerHTML = `

            <div class="empty-icon">

                🏆

            </div>


            <h2>

                No helpers on the leaderboard yet

            </h2>


            <p>

                Help someone successfully find
                their lost item to earn points!

            </p>

        `;


        return;

    }


    container.className =
        "leaderboard-list";


    container.innerHTML =

        helpers

            .map(

                (user, index) => {

                    const rank =
                        index + 1;


                    let medal =
                        "🏅";


                    if (rank === 1) {

                        medal =
                            "🥇";

                    }

                    else if (rank === 2) {

                        medal =
                            "🥈";

                    }

                    else if (rank === 3) {

                        medal =
                            "🥉";

                    }


                    const initial =

                        (
                            user.name ||
                            "U"
                        )

                            .charAt(0)
                            .toUpperCase();


                    const isMe =

                        currentUser &&

                        user.id ===
                        currentUser.uid;


                    return `

                        <div
                            class="leaderboard-item"
                        >


                            <div
                                class="leaderboard-rank"
                            >

                                ${medal}

                                #${rank}

                            </div>


                            <div
                                class="leaderboard-user"
                            >


                                <div
                                    class="user-avatar"
                                >

                                    ${initial}

                                </div>


                                <div>

                                    <b>

                                        ${escapeHTML(
                                            user.name ||
                                            "Campus User"
                                        )}

                                        ${
                                            isMe
                                                ? " (You)"
                                                : ""
                                        }

                                    </b>


                                    <small>

                                        ${
                                            user.resolvedCount ||
                                            0
                                        }

                                        successful helps

                                    </small>

                                </div>


                            </div>


                            <div
                                class="leaderboard-points"
                            >

                                ⭐

                                ${
                                    user.points ||
                                    0
                                }

                                points

                            </div>


                        </div>

                    `;

                }

            )

            .join("");

}


// ========================================
// NAVIGATION
// ========================================

function showPage(
    pageName,
    button
) {

    document

        .querySelectorAll(
            ".page-section"
        )

        .forEach(

            page =>

                page.classList.remove(
                    "active-page"
                )

        );


    const selectedPage =

        document.getElementById(
            pageName +
            "Page"
        );


    if (selectedPage) {

        selectedPage.classList.add(
            "active-page"
        );

    }


    document

        .querySelectorAll(
            ".nav-item"
        )

        .forEach(

            item =>

                item.classList.remove(
                    "active"
                )

        );


    if (button) {

        button.classList.add(
            "active"
        );

    }


    if (pageName === "browse") {

        renderBrowseItems();

    }


    if (pageName === "home") {

        renderRecentItems();

    }


    if (pageName === "myposts") {

        renderMyPosts();

    }


    if (pageName === "leaderboard") {

        renderLeaderboard();

        updateMyPoints();

    }

}


// ========================================
// SHOW PAGE BY NAME
// ========================================

function showPageByName(pageName) {

    document

        .querySelectorAll(
            ".page-section"
        )

        .forEach(

            page =>

                page.classList.remove(
                    "active-page"
                )

        );


    const selectedPage =

        document.getElementById(
            pageName +
            "Page"
        );


    if (selectedPage) {

        selectedPage.classList.add(
            "active-page"
        );

    }


    document

        .querySelectorAll(
            ".nav-item"
        )

        .forEach(

            item => {

                item.classList.remove(
                    "active"
                );


                const text =

                    item.innerText
                        .toLowerCase();


                if (

                    text.includes(
                        pageName
                    )

                ) {

                    item.classList.add(
                        "active"
                    );

                }

            }

        );


    if (pageName === "browse") {

        renderBrowseItems();

    }

}


// ========================================
// ITEM EMOJI
// ========================================

function getItemEmoji(category) {

    const emojis = {

        "Electronics":
            "📱",

        "Bags":
            "🎒",

        "ID Cards":
            "🪪",

        "Accessories":
            "⌚",

        "Other":
            "📦"

    };


    return (

        emojis[category] ||

        "📦"

    );

}


// ========================================
// SAFE HTML
// ========================================

function escapeHTML(text) {

    if (

        text === undefined ||

        text === null

    ) {

        return "";

    }


    const div =

        document.createElement(
            "div"
        );


    div.innerText =
        String(text);


    return div.innerHTML;

}


// ========================================
// CREATE ITEM CARD
// ========================================

function createItemCard(item) {

    const resolved =

        item.status ===
        "Resolved";


    return `

        <div
            class="item-card"
            onclick="openDetails('${item.id}')"
        >


            <div class="item-image">

                ${item.emoji || "📦"}

            </div>


            <div class="item-top">


                <span

                    class="status ${(
                        item.type || ""
                    ).toLowerCase()}"

                >

                    ${
                        resolved

                            ? "RESOLVED"

                            : escapeHTML(
                                (
                                    item.type ||
                                    ""
                                ).toUpperCase()
                            )
                    }

                </span>


                <small>

                    ${escapeHTML(
                        item.category
                    )}

                </small>


            </div>


            <h3>

                ${escapeHTML(
                    item.name
                )}

            </h3>


            <p
                class="description"
            >

                ${escapeHTML(
                    item.description
                )}

            </p>


            <div
                class="item-meta"
            >


                <span>

                    <i
                        class="fa-solid fa-location-dot"
                    ></i>

                    ${escapeHTML(
                        item.location
                    )}

                </span>


                <span>

                    <i
                        class="fa-regular fa-calendar"
                    ></i>

                    ${formatDate(
                        item.date
                    )}

                </span>


            </div>


            ${
                resolved

                    ? `

                        <p style="
                            margin-top: 12px;
                            font-weight: 600;
                        ">

                            ✅ Successfully resolved

                        </p>

                    `

                    : ""

            }


        </div>

    `;

}


// ========================================
// RECENT ITEMS
// ========================================

function renderRecentItems() {

    const container =

        document.getElementById(
            "recentItems"
        );


    if (!container) return;


    const recentItems =

        items

            .slice()

            .reverse()

            .slice(0, 4);


    if (recentItems.length === 0) {

        container.innerHTML = `

            <div style="
                padding: 30px;
                color: #9aa8c2;
            ">

                🔍 No reports yet.
                Be the first to help!

            </div>

        `;


        return;

    }


    container.innerHTML =

        recentItems

            .map(
                item =>
                    createItemCard(item)
            )

            .join("");

}


// ========================================
// BROWSE ITEMS
// ========================================

function renderBrowseItems(
    itemsToRender = items
) {

    const container =

        document.getElementById(
            "browseItems"
        );


    if (!container) return;


    if (
        itemsToRender.length === 0
    ) {

        container.innerHTML = `

            <div style="
                padding: 30px;
                color: #9aa8c2;
            ">

                😕 No items found.

            </div>

        `;


        return;

    }


    container.innerHTML =

        itemsToRender

            .slice()

            .reverse()

            .map(
                item =>
                    createItemCard(item)
            )

            .join("");

}


// ========================================
// FILTER ITEMS
// ========================================

function filterItems(
    type,
    button
) {

    currentFilter =
        type;


    document

        .querySelectorAll(
            ".filter-btn"
        )

        .forEach(

            btn =>

                btn.classList.remove(
                    "active"
                )

        );


    if (button) {

        button.classList.add(
            "active"
        );

    }


    searchItems();

}


// ========================================
// SEARCH ITEMS
// ========================================

function searchItems() {

    const searchElement =

        document.getElementById(
            "searchInput"
        );


    const categoryElement =

        document.getElementById(
            "categoryFilter"
        );


    if (

        !searchElement ||

        !categoryElement

    ) return;


    const search =

        searchElement.value
            .toLowerCase();


    const category =

        categoryElement.value;


    const filtered =

        items.filter(

            item => {


                const matchesSearch =

                    (
                        item.name ||
                        ""
                    )

                        .toLowerCase()

                        .includes(search)

                    ||

                    (
                        item.description ||
                        ""
                    )

                        .toLowerCase()

                        .includes(search)

                    ||

                    (
                        item.location ||
                        ""
                    )

                        .toLowerCase()

                        .includes(search);


                const matchesType =

                    currentFilter === "All"

                    ||

                    item.type ===
                    currentFilter;


                const matchesCategory =

                    category === "All"

                    ||

                    item.category ===
                    category;


                return (

                    matchesSearch &&

                    matchesType &&

                    matchesCategory

                );

            }

        );


    renderBrowseItems(
        filtered
    );

}


// ========================================
// OPEN POST MODAL
// ========================================

function openPostModal(type) {

    if (!currentUser) {

        showToast(
            "Please login first!"
        );

        return;

    }


    currentType =
        type;


    document

        .getElementById(
            "modalType"
        )

        .innerText =

        type === "Lost"

            ? "REPORT LOST ITEM"

            : "REPORT FOUND ITEM";


    document

        .getElementById(
            "modalTitle"
        )

        .innerText =

        type === "Lost"

            ? "What did you lose?"

            : "What did you find?";


    document

        .getElementById(
            "postModal"
        )

        .style.display =
        "flex";


    document

        .getElementById(
            "possibleMatches"
        )

        .style.display =
        "none";


    document

        .getElementById(
            "itemDate"
        )

        .valueAsDate =
        new Date();

}


// ========================================
// CLOSE POST MODAL
// ========================================

function closePostModal() {

    document

        .getElementById(
            "postModal"
        )

        .style.display =
        "none";


    const form =

        document.querySelector(
            "#postModal form"
        );


    if (form) {

        form.reset();

    }

}


// ========================================
// SUBMIT ITEM
// ========================================

async function submitItem(event) {

    event.preventDefault();


    if (!currentUser) {

        showToast(
            "Please login first!"
        );

        return;

    }


    const name =

        document

            .getElementById(
                "itemName"
            )

            .value

            .trim();


    const category =

        document

            .getElementById(
                "itemCategory"
            )

            .value;


    const location =

        document

            .getElementById(
                "itemLocation"
            )

            .value

            .trim();


    const date =

        document

            .getElementById(
                "itemDate"
            )

            .value;


    const description =

        document

            .getElementById(
                "itemDescription"
            )

            .value

            .trim();


    if (

        !name ||

        !category ||

        !location ||

        !date ||

        !description

    ) {

        showToast(
            "Please fill all required fields!"
        );

        return;

    }


    try {

        await addDoc(

            collection(
                db,
                "items"
            ),

            {

                name:
                    name,

                type:
                    currentType,

                category:
                    category,

                location:
                    location,

                date:
                    date,

                description:
                    description,

                emoji:
                    getItemEmoji(
                        category
                    ),

                ownerName:
                    currentUser.displayName ||
                    "Campus User",

                ownerId:
                    currentUser.uid,

                ownerEmail:
                    currentUser.email ||
                    "",

                status:
                    "Open",

                helperId:
                    null,

                helperName:
                    null,

                pointsAwarded:
                    false,

                createdAt:
                    serverTimestamp()

            }

        );


        closePostModal();


        showToast(
            "🎉 Your report has been published!"
        );

    }

    catch (error) {

        console.error(error);


        showToast(
            "❌ Could not publish report."
        );

    }

}


// ========================================
// OPEN ITEM DETAILS
// ========================================

function openDetails(id) {

    openDetailsId = id;

    const item =

        items.find(

            item =>
                item.id === id

        );


    if (!item) {

        openDetailsId = null;

        return;

    }


    const details =

        document.getElementById(
            "detailsContent"
        );


    const isMyItem =

        currentUser &&

        item.ownerId ===
        currentUser.uid;


    const isResolved =

        item.status ===
        "Resolved";


    const hasHelper =

        !!item.helperId;


    let actionButton =
        "";


    // ALREADY RESOLVED

    if (isResolved) {

        actionButton = `

            <button
                class="claim-btn"
                disabled
            >

                ✅ Item Resolved

            </button>

        `;

    }


    // OWNER CAN CONFIRM

    else if (

        isMyItem &&

        hasHelper

    ) {

        actionButton = `

            <button
                class="claim-btn"
                onclick="markAsResolved('${item.id}')"
            >

                ✅ Mark as Resolved
                (+10 points to helper)

            </button>

        `;

    }


    // OWNER WAITING

    else if (

        isMyItem &&

        !hasHelper

    ) {

        actionButton = `

            <button
                class="claim-btn"
                onclick="showToast('🤝 Waiting for someone to offer help!')"
            >

                📦 Your Post

            </button>

        `;

    }


    // CURRENT USER IS HELPER

    else if (

        !isMyItem &&

        hasHelper &&

        currentUser &&

        item.helperId ===
        currentUser.uid

    ) {

        actionButton = `

            <button
                class="claim-btn"
                disabled
            >

                🤝 You are helping with this item

            </button>

        `;

    }


    // SOMEONE ELSE HELPING

    else if (

        !isMyItem &&

        hasHelper

    ) {

        actionButton = `

            <button
                class="claim-btn"
                disabled
            >

                🤝 Someone is already helping

            </button>

        `;

    }


    // HELP LOST ITEM

    else if (

        !isMyItem &&

        item.type === "Lost"

    ) {

        actionButton = `

            <button
                class="claim-btn"
                onclick="helpWithItem('${item.id}')"
            >

                🤝 I Can Help

            </button>

        `;

    }


    // CLAIM FOUND ITEM

    else if (

        !isMyItem &&

        item.type === "Found"

    ) {

        actionButton = `

            <button
                class="claim-btn"
                onclick="claimItem('${item.id}')"
            >

                🔐 Claim This Item

            </button>

        `;

    }


    details.innerHTML = `

        <div class="details-image">

            ${item.emoji || "📦"}

        </div>


        <span
            class="status ${(
                item.type || ""
            ).toLowerCase()} details-status"
        >

            ${
                isResolved

                    ? "RESOLVED"

                    : escapeHTML(
                        (
                            item.type ||
                            ""
                        ).toUpperCase()
                    )
            }

        </span>


        <h2>

            ${escapeHTML(
                item.name
            )}

        </h2>


        <p class="details-description">

            ${escapeHTML(
                item.description
            )}

        </p>


        <div class="item-meta">


            <span>

                <i
                    class="fa-solid fa-location-dot"
                ></i>

                ${escapeHTML(
                    item.location
                )}

            </span>


            <span>

                <i
                    class="fa-regular fa-calendar"
                ></i>

                ${formatDate(
                    item.date
                )}

            </span>


            <span>

                <i
                    class="fa-solid fa-tag"
                ></i>

                ${escapeHTML(
                    item.category
                )}

            </span>


        </div>


        <p style="
            margin-top: 15px;
            color: #9aa8c2;
        ">

            Posted by

            <b>

                ${escapeHTML(
                    item.ownerName ||
                    "Campus User"
                )}

            </b>

        </p>


        ${
            hasHelper &&

            !isResolved

                ?

                `

                    <p style="
                        margin-top: 10px;
                        color: #9aa8c2;
                    ">

                        🤝 Helper:

                        <b>

                            ${escapeHTML(
                                item.helperName ||
                                "Campus Helper"
                            )}

                        </b>

                    </p>

                `

                :

                ""

        }


        ${actionButton}

    `;


    document

        .getElementById(
            "detailsModal"
        )

        .style.display =
        "flex";

}


// ========================================
// HELP WITH LOST ITEM
// ========================================

async function helpWithItem(id) {

    if (!currentUser) {

        showToast(
            "Please login first!"
        );

        return;

    }


    try {

        await runTransaction(

            db,

            async (transaction) => {

                const itemRef =

                    doc(
                        db,
                        "items",
                        id
                    );


                const itemSnap =

                    await transaction.get(
                        itemRef
                    );


                if (!itemSnap.exists()) {

                    throw new Error(
                        "Item no longer exists."
                    );

                }


                const freshItem =
                    itemSnap.data();


                if (freshItem.helperId) {

                    throw new Error(
                        "Someone is already helping."
                    );

                }


                if (

                    freshItem.status ===
                    "Resolved"

                ) {

                    throw new Error(
                        "Item is already resolved."
                    );

                }


                if (

                    freshItem.ownerId ===
                    currentUser.uid

                ) {

                    throw new Error(
                        "You cannot help your own post."
                    );

                }


                transaction.update(

                    itemRef,

                    {

                        helperId:
                            currentUser.uid,

                        helperName:
                            currentUser.displayName ||
                            "Campus User",

                        helperAcceptedAt:
                            serverTimestamp()

                    }

                );

            }

        );


        showToast(
            "🤝 You are now helping! Wait for the owner to confirm."
        );


        closeDetailsModal();

    }

    catch (error) {

        console.error(error);


        showToast(
            "❌ " +
            error.message
        );

    }

}


// ========================================
// MARK AS RESOLVED
// + AWARD 10 POINTS
// ========================================

async function markAsResolved(id) {

    if (!currentUser) return;


    try {

        await runTransaction(

            db,

            async (transaction) => {

                const itemRef =

                    doc(
                        db,
                        "items",
                        id
                    );


                const itemSnap =

                    await transaction.get(
                        itemRef
                    );


                if (!itemSnap.exists()) {

                    throw new Error(
                        "Item does not exist."
                    );

                }


                const freshItem =
                    itemSnap.data();


                if (

                    freshItem.ownerId !==
                    currentUser.uid

                ) {

                    throw new Error(
                        "Only the owner can mark this item as resolved."
                    );

                }


                if (!freshItem.helperId) {

                    throw new Error(
                        "No helper assigned yet."
                    );

                }


                if (

                    freshItem.status ===
                    "Resolved"

                ) {

                    throw new Error(
                        "Item is already resolved."
                    );

                }


                const helperRef =

                    doc(
                        db,
                        "users",
                        freshItem.helperId
                    );


                const helperSnap =

                    await transaction.get(
                        helperRef
                    );


                // RESOLVE ITEM

                transaction.update(

                    itemRef,

                    {

                        status:
                            "Resolved",

                        resolvedAt:
                            serverTimestamp(),

                        pointsAwarded:
                            true

                    }

                );


                // AWARD POINTS

                if (helperSnap.exists()) {

                    transaction.update(

                        helperRef,

                        {

                            points:
                                increment(10),

                            resolvedCount:
                                increment(1)

                        }

                    );

                }

            }

        );


        showToast(
            "🎉 Item resolved! Helper earned +10 points!"
        );


        closeDetailsModal();

    }

    catch (error) {

        console.error(error);


        showToast(
            "❌ " +
            error.message
        );

    }

}


// ========================================
// CLOSE DETAILS MODAL
// ========================================

function closeDetailsModal() {

    openDetailsId = null;

    document

        .getElementById(
            "detailsModal"
        )

        .style.display =
        "none";

}


// ========================================
// CLAIM FOUND ITEM
// ========================================

async function claimItem(id) {

    if (!currentUser) {

        showToast(
            "Please login first!"
        );

        return;

    }

    try {

        await runTransaction(

            db,

            async (transaction) => {

                const itemRef =
                    doc(
                        db,
                        "items",
                        id
                    );

                const itemSnap =
                    await transaction.get(
                        itemRef
                    );

                if (!itemSnap.exists()) {

                    throw new Error(
                        "Item no longer exists."
                    );

                }

                const freshItem =
                    itemSnap.data();

                if (
                    freshItem.type !==
                    "Found"
                ) {

                    throw new Error(
                        "This is not a found item."
                    );

                }

                if (
                    freshItem.status ===
                    "Resolved"
                ) {

                    throw new Error(
                        "Item is already resolved."
                    );

                }

                if (
                    freshItem.ownerId ===
                    currentUser.uid
                ) {

                    throw new Error(
                        "You cannot claim your own post."
                    );

                }

                if (freshItem.helperId) {

                    throw new Error(
                        "This item has already been claimed by someone."
                    );

                }

                transaction.update(

                    itemRef,

                    {
                        helperId:
                            currentUser.uid,

                        helperName:
                            currentUser.displayName ||
                            "Campus User",

                        helperAcceptedAt:
                            serverTimestamp(),

                        claimStatus:
                            "Pending Verification"
                    }

                );

            }

        );

        showToast(
            "🔐 Claim request sent! The finder can now see your claim."
        );

        closeDetailsModal();

    }

    catch (error) {

        console.error(error);

        showToast(
            "❌ " +
            error.message
        );

    }

}


// ========================================
// MY POSTS
// ========================================

function renderMyPosts() {

    const container =

        document.getElementById(
            "myPosts"
        );


    if (!container) return;


    if (!currentUser) {

        container.innerHTML =
            "";

        return;

    }


    const myItems =

        items.filter(

            item =>

                item.ownerId ===
                currentUser.uid

        );


    if (myItems.length === 0) {

        container.innerHTML = `

            <div style="
                padding: 30px;
                color: #9aa8c2;
            ">

                📭 You haven't posted anything yet.

            </div>

        `;


        return;

    }


    container.innerHTML =

        myItems

            .slice()

            .reverse()

            .map(

                item =>

                    createItemCard(
                        item
                    )

            )

            .join("");

}


// ========================================
// DATE FORMAT
// ========================================

function formatDate(dateString) {

    if (!dateString) {

        return "Unknown date";

    }


    const date =

        new Date(
            dateString
        );


    if (

        isNaN(
            date.getTime()
        )

    ) {

        return dateString;

    }


    return date.toLocaleDateString(

        "en-IN",

        {

            day:
                "numeric",

            month:
                "short",

            year:
                "numeric"

        }

    );

}


// ========================================
// TOAST
// ========================================

function showToast(message) {

    const toast =

        document.getElementById(
            "toast"
        );


    if (!toast) return;


    toast.innerText =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(

        () => {

            toast.classList.remove(
                "show"
            );

        },

        3000

    );

}


// ========================================
// CLOSE MODALS ON OUTSIDE CLICK
// ========================================

window.addEventListener(

    "click",

    function(event) {

        const postModal =

            document.getElementById(
                "postModal"
            );


        const detailsModal =

            document.getElementById(
                "detailsModal"
            );


        if (

            event.target ===
            postModal

        ) {

            closePostModal();

        }


        if (

            event.target ===
            detailsModal

        ) {

            closeDetailsModal();

        }

    }

);


// ========================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ========================================

window.login =
    login;

window.logout =
    logout;

window.showPage =
    showPage;

window.showPageByName =
    showPageByName;

window.filterItems =
    filterItems;

window.searchItems =
    searchItems;

window.openPostModal =
    openPostModal;

window.closePostModal =
    closePostModal;

window.submitItem =
    submitItem;

window.openDetails =
    openDetails;

window.closeDetailsModal =
    closeDetailsModal;

window.claimItem =
    claimItem;

window.helpWithItem =
    helpWithItem;

window.markAsResolved =
    markAsResolved;

window.showToast =
    showToast;


// ========================================
// INITIALIZE
// ========================================

document.addEventListener(

    "DOMContentLoaded",

    function() {

        renderRecentItems();

        renderBrowseItems();

        renderLeaderboard();

        updateMyPoints();

    }

);
