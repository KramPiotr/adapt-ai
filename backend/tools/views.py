from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import ConversationMessage

class StoreTranscriptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        # Debug: Check the authenticated user.
        print("AUTHENTICATED USER:", request.user)

        transcript = request.data.get("transcript")
        if not transcript:
            return Response({"error": "No transcript provided."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Allow the client to specify the status if needed, or default to "in_progress"
        status_value = request.data.get("status", "in_progress")
        # Optionally, you might add validation here to ensure that status_value is one of the allowed choices.
        allowed_statuses = [choice[0] for choice in ConversationMessage.STATUS_CHOICES]
        if status_value not in allowed_statuses:
            return Response({"error": f"Invalid status. Allowed values are: {allowed_statuses}"},
                            status=status.HTTP_400_BAD_REQUEST)

        message_instance = ConversationMessage.objects.create(
            user=request.user,
            message=transcript,
            status=status_value,
            ai_response=None
        )

        data = {
            "id": message_instance.id,
            "transcript": message_instance.message,
            "timestamp": message_instance.timestamp,
            "status": message_instance.status,
        }
        return Response(data, status=status.HTTP_201_CREATED)


class ConversationHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):

        try:
            limit = int(request.data.get("limit", 10))
        except ValueError:
            return Response({"error": "Invalid limit value."}, status=status.HTTP_400_BAD_REQUEST)


        messages_qs = ConversationMessage.objects.filter(user=request.user).order_by('-timestamp')[:limit]
        messages = list(messages_qs)[::-1]  # Reverse to show chronological order

        conversation_history = []
        for msg in messages:
            conversation_history.append({
                "role": "user",
                "content": msg.message,
                "status": msg.status,
                "timestamp": msg.timestamp
            })
            if msg.ai_response:
                conversation_history.append({
                    "role": "assistant",
                    "content": msg.ai_response,
                    "timestamp": msg.timestamp
                })

        return Response(conversation_history, status=status.HTTP_200_OK)

class MessageStatusView(APIView):
    """
    Endpoint to get the latest message by the user along with its status and ai_response.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        message_instance = ConversationMessage.objects.filter(user=request.user).order_by('-timestamp').first()
        if not message_instance:
            return Response({"error": "No messages found for this user."}, status=status.HTTP_404_NOT_FOUND)

        response_data = {
            "transcript": message_instance.message,
            "status": message_instance.status,
            "ai_response": message_instance.ai_response,
            "timestamp": message_instance.timestamp,
        }
        return Response(response_data, status=status.HTTP_200_OK)

class StopExecutionView(APIView):
    """
    Endpoint that allows a user to kill the execution of their latest message.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        message_instance = ConversationMessage.objects.filter(user=request.user).order_by('-timestamp').first()
        if not message_instance:
            return Response({"error": "No message found for this user."}, status=status.HTTP_404_NOT_FOUND)

        if message_instance.status != "in_progress":
            return Response(
                {"error": "The latest message is not in progress and cannot be stopped."},
                status=status.HTTP_400_BAD_REQUEST
            )

        message_instance.status = "killed"
        message_instance.save()

        data = {
            "id": message_instance.id,
            "transcript": message_instance.message,
            "status": message_instance.status,
            "timestamp": message_instance.timestamp,
        }
        return Response(data, status=status.HTTP_200_OK)
