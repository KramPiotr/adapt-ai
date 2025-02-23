from django.urls import path
from .views import StoreTranscriptView, ConversationHistoryView, \
                   MessageStatusView, StopExecutionView

urlpatterns = [
    path("store/", StoreTranscriptView.as_view(), name="store-transcript"),
    path("history/", ConversationHistoryView.as_view(), name="conversation-history"),
    path("status/", MessageStatusView.as_view(), name="message-status"),
    path("stop/", StopExecutionView.as_view(), name="stop-execution"),
]
