from django.urls import path
from .views import (
    UploadView, EmissionRowListView,
    EmissionRowDetailView, DashboardStatsView,
    IngestionRunListView
)

urlpatterns = [
    path('upload/', UploadView.as_view(), name='upload'),
    path('rows/', EmissionRowListView.as_view(), name='rows'),
    path('rows/<int:pk>/', EmissionRowDetailView.as_view(), name='row-detail'),
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard'),
    path('runs/', IngestionRunListView.as_view(), name='runs'),
]