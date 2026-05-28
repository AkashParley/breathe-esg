from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Client

admin.site.register(Client)
admin.site.register(User, UserAdmin)