/**
 * Email Service for sending notifications via Backend Brevo
 */

interface TaskEmailData {
    recipientEmail: string;
    recipientName: string;
    taskTitle: string;
    deadline?: string;
    eventTitle: string;
    assignedBy: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Check if Email service is configured (always true now as it's backend-led)
 */
export const isEmailConfigured = (): boolean => {
    return true;
};

/**
 * Check if event update emails are configured (always true now)
 */
export const isEventEmailConfigured = (): boolean => {
    return true;
};

/**
 * Send task assignment email to a member
 * Note: Modern standalone tasks are already handled by the backend routes.
 * This is kept for compatibility if any frontend-only triggers remain.
 */
export const sendTaskAssignmentEmail = async (_data: TaskEmailData): Promise<boolean> => {
    // Current standalone task system handles emails on the backend when POST/PUT /tasks is called.
    return true;
};

/**
 * Send task assignment emails to multiple members
 */
export const sendTaskAssignmentEmails = async (
    _emails: string[],
    _names: string[],
    _taskTitle: string,
    _deadline: string | undefined,
    _eventTitle: string,
    _assignedBy: string
): Promise<void> => {
    // Handled by backend for standalone tasks.
};



/**
 * Send event update email to a single attendee
 * Delegates to the unified sendEventUpdateEmails for consistency
 */
export const sendEventUpdateEmail = async (
    recipientEmail: string,
    recipientName: string,
    eventTitle: string,
    updateMessage: string,
    clubName: string
): Promise<boolean> => {
    try {
        await sendEventUpdateEmails(
            [{ name: recipientName, email: recipientEmail }],
            eventTitle,
            updateMessage,
            clubName
        );
        return true;
    } catch (error) {
        console.error('Failed to send event update email:', error);
        return false;
    }
};

/**
 * Send event update emails to all RSVPed attendees via backend
 */
export const sendEventUpdateEmails = async (
    attendees: Array<{ name: string; email: string }>,
    eventTitle: string,
    updateMessage: string,
    clubName: string
): Promise<void> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required');

        const response = await fetch(`${API_URL}/posts/send-event-update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                updateMessage,
                attendees,
                eventTitle,
                clubName,
                // Passing a placeholder eventId as the backend expects it, 
                // though it's primarily used for logging/auth check context
                eventId: 'BULK_UPDATE'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to send bulk emails');
        }

    } catch (error) {
        console.error('Error sending event update emails via backend:', error);
        throw error;
    }
};
