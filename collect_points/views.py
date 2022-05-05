from django.shortcuts import render

from collect_points.models import CollectPoint


def index(request):
    context = {
        'collect_points': CollectPoint.objects.values()
    }
    return render(request, 'index.html', context)
