from django.db import models

class ConversationMessage(models.Model):
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('finished', 'Finished'),
        ('errored', 'Errored'),
        ('killed', 'Killed'),
    ]

    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    ai_response = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.message[:50]}"
