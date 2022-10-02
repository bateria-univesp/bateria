from rest_framework import serializers

from collect_points.models import CollectPoint


class CollectPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollectPoint
        fields = ('latitude', 'longitude', 'name', 'address', 'logo_url')
