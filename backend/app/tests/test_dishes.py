import pytest
import requests

BASE_URL = "http://127.0.0.1:8080/api/v1/dishes"

@pytest.mark.parametrize("endpoint", ["/popular"])
def test_popular_dishes(endpoint):
    # Llamamos al endpoint
    response = requests.get(BASE_URL + endpoint)
    
    # Validamos que responde 200 OK
    assert response.status_code == 200
    
    data = response.json()
    
    # Validamos que devuelve al menos un plato
    assert isinstance(data, list)
    assert len(data) > 0, "El endpoint /popular debe devolver al menos un plato"
    
    # Validamos que cada plato tenga producer_id no nulo
    for dish in data:
        assert dish.get("producer_id") is not None, f"El plato {dish} no tiene producer_id"
