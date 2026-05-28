from django.contrib.auth.models import AbstractUser
from django.db import models

class Client(models.Model):
    """One row per enterprise client — multi-tenancy anchor"""
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    """Analyst accounts tied to a client"""
    client = models.ForeignKey(
        Client, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='users'
    )
    is_analyst = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.username} ({self.client})"