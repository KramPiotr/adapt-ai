import os
import requests
import openai
import json

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

def decide_next_message_state(conversation_summary: str, current_message: str) -> dict:
    """
    Decides the next message state based on the previous conversation summary
    and the current user message. It uses an LLM from OpenAI via the ChatCompletion
    API. The comprehensive scene transition principles are provided in the system prompt.

    Parameters:
      conversation_summary (str): A summary of the previous conversation.
      current_message (str): The current message that the user is sending.

    Returns:
      dict: A dictionary containing the recommended state (e.g., "G1", "W2", etc.),
            a descriptive name for the scene, and an explanation.

    Example return format:
      {
        "recommended_state": "G1",
        "scene_name": "Direct-Structured Goal Scene",
        "explanation": "Pattern matching indicated that..."
      }
    """

    # Define a detailed system prompt that outlines the scene transition principles.
    system_prompt = (
        "You are an intelligent assistant that helps decide the state of a conversation "
        "based on comprehensive scene transition principles. "
        "Below is a summary of the decision rules:\n\n"
        "Comprehensive Scene Transition Principles:\n\n"
        "1. GOAL Phase Priority Scenes:\n"
        "   - G1: Direct-Structured Goal Scene (signals: 'I need to achieve', 'my target', 'specific results')\n"
        "   - G2: Values-Deep-Dive Goal Scene (signals: 'really matter', 'questioning why', 'align with')\n"
        "   - G3: Strategic-Analytical Goal Scene (signals: 'analyze', 'strategic implications', 'metrics')\n\n"
        "2. REALITY Phase Priority Scenes:\n"
        "   - R1: Systematic-Assessment Reality Scene (signals: 'understand exactly', 'analyze all components')\n"
        "   - R2: Emotional-Landscape Reality Scene (signals: 'feel stuck', 'reacting the same way')\n"
        "   - R3: Systems-Thinking Reality Scene (signals: 'everything is connected', 'ripple effects')\n\n"
        "3. OPPORTUNITY Phase Priority Scenes:\n"
        "   - O1: Strategic-Analytical Opportunity Scene (signals: 'evaluate options', 'strategic implications')\n"
        "   - O2: Solution-Engineering Opportunity Scene (signals: 'concrete plan', 'make this work')\n"
        "   - O3: Creative-Generative Opportunity Scene (signals: 'what if we', 'think differently')\n\n"
        "4. WAY FORWARD Phase Priority Scenes:\n"
        "   - W1: Action-Planning Way Forward Scene (signals: 'start implementing', 'clear direction')\n"
        "   - W2: Commitment-Building Way Forward Scene (signals: 'this matters', 'make this my own')\n"
        "   - W3: Integration-Focused Way Forward Scene (signals: 'really stick', 'fits together')\n\n"
        "Based on the conversation history and the current message, decide which state "
        "the next message should be and provide an explanation. "
        "Return your answer in JSON format as follows:\n"
        "{\"recommended_state\": \"<scene code>\", \"scene_name\": \"<descriptive name>\", "
        "\"explanation\": \"<your explanation>\"}\n"
    )

    # Formulate conversation messages for the OpenAI ChatCompletion call.
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Conversation Summary:\n{conversation_summary}"},
        {"role": "user", "content": f"Current Message:\n{current_message}"}
    ]

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",   # Or use another model as needed.
            messages=messages,
            temperature=0.3,  # Lower temperature for more deterministic answers.
            max_tokens=250
        )
    except Exception as e:
        raise Exception(f"OpenAI API call failed: {e}")

    # Parse the answer.
    answer = response["choices"][0]["message"]["content"]

    try:
        # Ensure the answer is valid JSON.
        result = json.loads(answer)
    except json.JSONDecodeError:
        # If the model did not return correctly formatted JSON, return a default.
        result = {
            "recommended_state": "G1",
            "scene_name": "Direct-Structured Goal Scene",
            "explanation": "Default state due to inability to parse the API result."
        }

    return result
