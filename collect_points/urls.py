from django.urls import path, include

import collect_points.views

urlpatterns = [
    path('', collect_points.views.index),
    path('api/', include('api.urls'))
]
