from rest_framework import serializers
from .models import User, Client

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'name', 'slug', 'created_at']

class UserSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'client', 'is_analyst']