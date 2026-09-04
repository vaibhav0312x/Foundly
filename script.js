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
