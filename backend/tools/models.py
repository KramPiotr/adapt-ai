from django.db import models

class ConversationMessage(models.Model):
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('finished', 'Finished'),
        ('errored', 'Errored'),
        ('killed', 'Killed'),
    ]

    TOOLS_CHOICES = [
        ('init-agent-flow', 'Initializing Agent Flow'),
        ('get-message-history', 'Get previous messages'),
        ('scene', 'Scene Architecture Determination'),
        ('rethink', 'Rethinking'),
        ('agent-thinks', 'Agent thinks now'),
        ('agent-observes', 'Agent observes now'),
        ('agent-decides-action', 'Agent action decision'),
        ('final-answer', 'The final answer is cooking'),
    ]

    SCENE_CHOICES = [
        ('None', 'Agents have not yet decided the scene'),
        ('G1', 'Direct-Structured Goal Scene'),
        ('G2', 'Values-Deep-Dive Goal Scene'),
        ('G3', 'Strategic-Analytical Goal Scene'),
        ('R1', 'Systematic-Assessment Reality Scene'),
        ('R2', 'Emotional-Landscape Reality Scene'),
        ('R3', 'Systems-Thinking Reality Scene'),
        ('O1', 'Strategic-Analytical Opportunity Scene'),
        ('O2', 'Solution-Engineering Opportunity Scene'),
        ('O3', 'Creative-Generative Opportunity Scene'),
        ('W1', 'Action-Planning Way Forward Scene'),
        ('W2', 'Commitment-Building Way Forward Scene'),
        ('W3', 'Integration-Focused Way Forward Scene'),
    ]

    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    scene = models.CharField(max_length=20, choices=SCENE_CHOICES, default='None')
    ai_response = models.TextField(null=True, blank=True)

    ai_action_log = models.CharField(max_length=20, choices=TOOLS_CHOICES, default='init-agent-flow')

    def __str__(self):
        return f"{self.message[:50]}"
