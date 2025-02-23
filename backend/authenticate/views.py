import random
from django.core.mail import send_mail
from rest_framework.permissions import AllowAny
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser
from .serializers import SignupSerializer, LoginSerializer

class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        username = serializer.validated_data['username']
        if CustomUser.objects.filter(email=email).exists():
            return Response({'error': 'A user with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        if CustomUser.objects.filter(username=username).exists():
            return Response({'error': 'A user with this username already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        user = CustomUser(email=email, username=username)
        code = f"{random.randint(100000, 999999):06}"
        user.login_code = code
        user.code_expiry_time = timezone.now() + timezone.timedelta(days=30)
        user.save()
        send_mail(
            'Your login code',
            f'Your login code is {code}',
            'from@example.com',  # Replace with your actual email sender address
            [email],
            fail_silently=False,
        )
        return Response({'message': f'User registered successfully! A login code has been sent to {email}.'}, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data['identifier']
        code = serializer.validated_data['code']
        user = CustomUser.objects.filter(email=identifier).first() or CustomUser.objects.filter(username=identifier).first()
        if not user:
            return Response({'error': 'User does not exist with the provided email/username.'}, status=status.HTTP_404_NOT_FOUND)
        if timezone.now() > user.code_expiry_time:
            return Response({'error': 'The code has expired.'}, status=status.HTTP_400_BAD_REQUEST)
        if user.login_code != code:
            return Response({'error': 'Invalid code.'}, status=status.HTTP_400_BAD_REQUEST)
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)
