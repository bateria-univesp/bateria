from os import getenv

from django.shortcuts import render

from collect_points.models import CollectPoint


def index(request):
    context = {
        'collect_points': list(CollectPoint.objects.values()),
        # This should be improved to get the API key from a service layer.
        'google_maps_api_key': getenv('GOOGLE_MAPS_API_KEY')
    }
    return render(request, 'index.html', context)
