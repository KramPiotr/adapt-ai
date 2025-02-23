import time
from celery import shared_task
from .models import ConversationMessage

@shared_task
def process_message_and_update(message_id):
    """
    Background task that waits 30 seconds, then updates the
    ConversationMessage with a dummy AI response and status = 'finished'.
    """
    try:
        time.sleep(30)

        msg = ConversationMessage.objects.get(id=message_id)

        msg.status = 'finished'
        msg.ai_response = "This is a dummy response from a Celery background task."
        msg.ai_action_log = "AI used tool XYZ -> Summarized user data -> Provided final result."
        msg.save()

    except ConversationMessage.DoesNotExist: pass
