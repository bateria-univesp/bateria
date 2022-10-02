from django.urls import include, path
from rest_framework import routers

from api.views import CollectPointViewSet

router = routers.DefaultRouter()
router.register('collect-point', CollectPointViewSet)

urlpatterns = [
    path('', include(router.urls))
]
