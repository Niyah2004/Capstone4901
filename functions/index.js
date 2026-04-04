const admin = require('firebase-admin');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');

admin.initializeApp();

async function sendExpoPush({ to, title, body, data }) {
    if (!to) return;

    const message = {
        to,
        sound: 'default',
        title: title || 'Habitat',
        body: body || '',
        data: data || {},
    };

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });

    // Expo returns JSON; we keep it for debugging.
    const json = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, json };
}

exports.onNotificationCreated = onDocumentCreated('notifications/{notificationId}', async (event) => {
    const snap = event.data;
    if (!snap) return;

    const notif = snap.data() || {};
    const toUserId = notif.toUserId;
    if (!toUserId) return;

    try {
        let childName = '';

        if (notif.type === 'completion_request' && notif.fromChildId) {
            try {
                const childrenSnap = await admin
                    .firestore()
                    .collection('children')
                    .where('userId', '==', notif.fromChildId)
                    .limit(1)
                    .get();

                if (!childrenSnap.empty) {
                    const childData = childrenSnap.docs[0].data() || {};
                    childName = childData.preferredName || childData.fullName || '';
                }
            } catch (e) {
                console.error('Error looking up child for notification:', e);
            }
        }

        const tokenSnap = await admin.firestore().doc(`userPushTokens/${toUserId}`).get();
        const expoPushToken = tokenSnap.exists ? tokenSnap.data()?.expoPushToken : null;

        if (!expoPushToken) {
            await snap.ref.set(
                {
                    push: { skipped: true, reason: 'missing_token' },
                    pushProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );
            return;
        }

        let title = notif.title;
        let body = notif.body;

        if (!title || !body) {
            if (notif.type === 'completion_request') {
                const baseTaskTitle = notif.taskTitle || '';

                if (!title) {
                    title = childName
                        ? `${childName} completed a task`
                        : 'Task Completed';
                }

                if (!body) {
                    if (childName && baseTaskTitle) {
                        body = `${childName} marked "${baseTaskTitle}" as complete and it is waiting for your review.`;
                    } else if (childName) {
                        body = `${childName} marked a task as complete and it is waiting for your review.`;
                    } else if (baseTaskTitle) {
                        body = `${baseTaskTitle} has been marked complete and is waiting for your review.`;
                    } else {
                        body = 'A task was completed.';
                    }
                }
            } else if (!title) {
                title = 'Notification';
            }
        }

        const result = await sendExpoPush({
            to: expoPushToken,
            title,
            body,
            data: {
                notificationId: event.params.notificationId,
                type: notif.type,
                taskId: notif.taskId || null,
            },
        });

        await snap.ref.set(
            {
                push: { sent: Boolean(result?.ok), result },
                pushProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
        );
    } catch (err) {
        console.error('Push send failed:', err);
        try {
            await snap.ref.set(
                {
                    push: { sent: false, error: String(err?.message || err) },
                    pushProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );
        } catch { }
    }
});
