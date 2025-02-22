from rest_framework import serializers

class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField(max_length=150)

class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()  # Can be either username or email
    code = serializers.CharField(max_length=6)
