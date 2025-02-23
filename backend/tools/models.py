from django.db import models
from django.conf import settings

class ConversationMessage(models.Model):
    # Status choices for the conversation message.
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('finished', 'Finished'),
        ('errored', 'Errored'),
        ('killed', 'Killed'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversation_messages"
    )
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')

    ai_response = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.email}: {self.message[:50]}"
