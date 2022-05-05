from django.urls import path

import collect_points.views

urlpatterns = [
    path('', collect_points.views.index)
]
