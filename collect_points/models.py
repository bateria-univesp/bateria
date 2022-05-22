from django.db import models


class CollectPoint(models.Model):
    latitude = models.FloatField(default=0, verbose_name='Latitude')
    longitude = models.FloatField(default=0, verbose_name='Longitude')
    name = models.CharField(max_length=128, verbose_name='Nome')
    address = models.CharField(max_length=512, verbose_name='Endereço')
    logo_url = models.CharField(max_length=1024, verbose_name='URL da Imagem')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Ponto'
