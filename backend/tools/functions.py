import os
import requests

def fetch_conversation_history(access_token: str, num_messages: int = 10):
    """
    Calls the conversation history endpoint (via POST) to retrieve the conversation history.

    The history endpoint URL is read from the 'HISTORY_ENDPOINT' environment variable.
    A JSON body is sent containing the 'limit' attribute defining how many messages to retrieve.
    The access token (provided by the new message endpoint) is included in the request headers.

    Parameters:
      access_token (str): The user's access token for authentication.
      num_messages (int): The number of recent messages to retrieve.

    Returns:
      dict/list: The conversation history response returned by the endpoint.

    Raises:
      ValueError: If HISTORY_ENDPOINT is not set in environment variables.
      Exception: For errors during the endpoint call.
    """
    # Get the endpoint from the environment.
    history_endpoint = os.getenv("HISTORY_ENDPOINT")
    if not history_endpoint:
        raise ValueError("HISTORY_ENDPOINT is not set in environment variables.")

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    payload = {
        "limit": num_messages
    }

    try:
        response = requests.post(history_endpoint, headers=headers, json=payload)
    except Exception as ex:
        raise Exception(f"Error calling history endpoint: {ex}")

    if response.status_code != 200:
        raise Exception(f"Failed to fetch conversation history: {response.status_code} - {response.text}")

    return response.json()
