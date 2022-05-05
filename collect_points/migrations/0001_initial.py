# Generated by Django 4.0.4 on 2022-04-27 23:12

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='CollectPoint',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('latitude', models.IntegerField(default=0)),
                ('longitude', models.IntegerField(default=0)),
                ('name', models.CharField(max_length=64)),
                ('description', models.CharField(max_length=256)),
                ('logo_url', models.CharField(max_length=1024)),
            ],
        ),
    ]