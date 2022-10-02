from rest_framework import viewsets

from api.serializers import CollectPointSerializer
from collect_points.models import CollectPoint


class CollectPointViewSet(viewsets.ModelViewSet):
    queryset = CollectPoint.objects.all()
    serializer_class = CollectPointSerializer
