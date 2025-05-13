import requests
import json

# Base URL
base_url = "http://localhost:8050"

# Headers
headers = {
    "Content-Type": "application/json",
    "x-api-key": "dev_api_key_change_this"
}

# Test health endpoint
def test_health():
    response = requests.get(f"{base_url}/health")
    print("Health check:", response.status_code)
    print(response.json())
    print("\n")

# Test Ruth chatbot
def test_ruth():
    data = {
        "user_message": "Olá, gostaria de saber mais sobre o curso de redação"
    }
    response = requests.post(f"{base_url}/v1/lead-messages/ruth", headers=headers, json=data)
    print("Ruth endpoint:", response.status_code)
    print(response.json() if response.status_code == 200 else response.text)
    print("\n")

# Test lead message generation
def test_lead_message():
    data = {
        "lead_info": {
            "id": "a5cd4a8d-1264-4752-b1a3-29e7e5740083",
            "name": "João Silva",
            "sentiment_status": "interessado",
            "lead_score": 85,
            "project_name": "Residencial Aurora"
        },
        "chatbot_type": "standard",
        "event_context": {
            "event_type": "visualizou_propriedade",
            "event_data": {
                "property_name": "Apartamento 302, Bloco A",
                "property_type": "Apartamento",
                "price": 350000
            },
            "message_purpose": "follow_up"
        }
    }
    response = requests.post(f"{base_url}/v1/lead-messages/generate", headers=headers, json=data)
    print("Lead message endpoint:", response.status_code)
    print(response.json() if response.status_code == 200 else response.text)
    print("\n")

if __name__ == "__main__":
    test_health()
    test_ruth()
    test_lead_message()