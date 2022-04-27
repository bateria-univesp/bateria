import requests
def get_lat_lon(endereco):
    """
    input: endereco
    output: None
    return: list

    endereco (String):
        Nome da rua na qual deseja receber latitude e longitude
    
    return:
        lista contendo latitude e longitude
    """
    r = requests.get("https://nominatim.openstreetmap.org/search?addressdetails=1&q={}&format=json&limit=1".format(endereco))
    return [r.json()[0]['lat'], r.json()[0]['lon']]