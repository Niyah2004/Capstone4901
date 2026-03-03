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

        const result = await sendExpoPush({
            to: expoPushToken,
            title: notif.title || (notif.type === 'completion_request' ? 'Task Completed' : 'Notification'),
            body: notif.body || (notif.type === 'completion_request' ? 'A task was completed.' : ''),
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
