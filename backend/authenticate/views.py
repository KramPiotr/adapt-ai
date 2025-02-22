import random
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser
from .serializers import SignupSerializer, LoginSerializer

class SignupView(APIView):
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        username = serializer.validated_data['username']

        user, created = CustomUser.objects.get_or_create(email=email, username=username)
        if created:
            # Send a 6-digit code to the user's email
            code = f"{random.randint(100000, 999999):06}"
            user.login_code = code
            user.code_expiry_time = timezone.now() + timezone.timedelta(minutes=10)  # Set expiry time
            user.save()

            send_mail(
                'Your login code',
                f'Your login code is {code}',
                'from@example.com',  # Replace with your email settings
                [email],
                fail_silently=False,
            )

        return Response({'message': f'If {email} is registered, you will receive a login code shortly.'}, status=status.HTTP_200_OK)

class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data['identifier']
        code = serializer.validated_data['code']

        user = CustomUser.objects.filter(email=identifier).first() or CustomUser.objects.filter(username=identifier).first()

        if user:
            if timezone.now() > user.code_expiry_time:
                return Response({'error': 'The code has expired.'}, status=status.HTTP_400_BAD_REQUEST)

            if user.login_code == code:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Invalid code.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'error': 'Invalid email/username.'}, status=status.HTTP_400_BAD_REQUEST)
