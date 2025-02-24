import json
import logging
import requests
from celery import shared_task
from celery.exceptions import MaxRetriesExceededError
from .models import ConversationMessage
from dotenv import load_dotenv
import os
import openai
import re

logger = logging.getLogger(__name__)

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    logger.error("OpenAI API key not found. Check your .env file.")
    raise ValueError("OpenAI API key not found. Check your .env file.")

BASE_URL = "http://localhost:8000"

SYSTEM_PROMPT = (
    "You are an assistant that summarizes how a new user message relates to the previous conversation. "
    "Focus on key topics, continuations, or shifts in context. "
    "If history is provided below with 'HISTORY:', use it directly and do not call 'fetch_conversation_history_from_api'. "
    "If no history is provided or you need more context beyond what’s given, call 'fetch_conversation_history_from_api' "
    "with a JSON object like {'function': 'fetch_conversation_history_from_api', 'parameters': {'limit': 5}}. "
    "Provide the 'limit' parameter to specify how many recent messages to retrieve. "
    "If the history fetch fails, use the error message and proceed with what you have. "
    "To determine the next conversation state (scene), call 'decide_next_message_state' with a JSON object like "
    "{'function': 'decide_next_message_state', 'parameters': {'conversation_summary': 'your_summary', 'current_message': 'user_message'}}. "
    "This will return a recommended state (e.g., 'G1', 'R2') and explanation. "
    "When you have enough information (or if no more context is available), return your summary as a **pure JSON object** "
    "with the key 'final_answer', e.g., {\"final_answer\": \"The user asked about X, next step is Y.\"}. "
    "If your initial summary isn’t conversational, engaging, or suitable for TTS, call 'rephrase_for_tts' with "
    "{'function': 'rephrase_for_tts', 'parameters': {'initial_response': 'your_summary'}}. "
    "When you receive the rephrased response from 'rephrase_for_tts' (provided as a tool response with a 'rephrased' key), "
    "use it directly as the final answer by returning it in a JSON object like {\"final_answer\": \"rephrased_response\"}. "
    "Base your final answer on the scene state from 'decide_next_message_state': provide what the user should do next "
    "or indicate if more information is needed, aligning with the scene’s purpose (e.g., G1: specific goals, R2: emotional context). "
    "The final output must be conversational, engaging, and suitable for TTS."
    "\n\nHISTORY: "
)

def call_agent(messages, tools):
    """Call OpenAI API with the current message history and available tools."""
    try:
        client = openai.OpenAI(api_key=openai.api_key)
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            tools=tools,
            tool_choice="auto"
        )
        message = response.choices[0].message

        logger.info("OpenAI response: %s", json.dumps({
            "content": message.content,
            "tool_calls": [tc.dict() for tc in message.tool_calls] if message.tool_calls else None
        }, indent=2))

        if message.tool_calls:
            tool_call = message.tool_calls[0].function
            return {
                "function_call": {
                    "name": tool_call.name,
                    "arguments": tool_call.arguments,
                    "tool_call_id": message.tool_calls[0].id
                }
            }
        return {"content": message.content}
    except openai.OpenAIError as e:
        logger.error(f"OpenAI API error: {str(e)}")
        raise

def call_agent_no_tools(messages):
    """Call OpenAI API without tools for a direct, conversational response."""
    try:
        client = openai.OpenAI(api_key=openai.api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages
        )
        message = response.choices[0].message

        logger.info("OpenAI no-tools response: %s", json.dumps({
            "content": message.content,
            "tool_calls": [tc.dict() for tc in message.tool_calls] if message.tool_calls else None
        }, indent=2))

        if message.content is None:
            logger.warning("No content returned from no-tools call, falling back to default.")
            return "I couldn’t generate a response, but I’m here to help. What can I do for you?"
        return message.content
    except openai.OpenAIError as e:
        logger.error(f"OpenAI API error in no-tools call: {str(e)}")
        raise

def fetch_conversation_history_from_api(limit=5):
    try:
        response = requests.get(f"{BASE_URL}/api/tools/history/", params={"limit": limit}, timeout=5)
        response.raise_for_status()
        history = response.json()
        return history
    except requests.RequestException as e:
        logger.error(f"Failed to fetch history with limit {limit}: {str(e)}")
        return {"error": f"Failed to fetch history: {str(e)}"}

def rephrase_for_tts(initial_response):
    """Rephrase the initial response for a conversational TTS output."""
    rephrase_prompt = (
        "Rephrase this statement into a conversational, friendly tone suitable for Text-to-Speech (TTS). "
        "Make it direct, engaging, and addressed to the user as if speaking to them. "
        "Add a question or offer help to keep the conversation going. Return a plain string, no JSON. "
        "Example: Input: 'The user previously expressed interest in buying ice cream.' "
        "Output: 'Yes, you expressed interest in buying ice cream, which is wonderful. Do you want help with that?'"
    )
    messages = [
        {"role": "system", "content": rephrase_prompt},
        {"role": "user", "content": initial_response}
    ]
    rephrased = call_agent_no_tools(messages)
    logger.info(f"Rephrased for TTS: {rephrased}")
    return rephrased

def decide_next_message_state(conversation_summary: str, current_message: str) -> dict:
    """Decides the next message state based on the previous conversation summary and current user message."""
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

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Conversation Summary:\n{conversation_summary}"},
        {"role": "user", "content": f"Current Message:\n{current_message}"}
    ]

    try:
        client = openai.OpenAI(api_key=openai.api_key)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.3,
            max_tokens=250
        )
        answer = response.choices[0].message.content
    except openai.OpenAIError as e:
        logger.error(f"OpenAI API error in decide_next_message_state: {str(e)}")
        raise

    try:
        result = json.loads(answer)
    except json.JSONDecodeError:
        logger.warning(f"Failed to parse decide_next_message_state response: {answer}")
        result = {
            "recommended_state": "G1",
            "scene_name": "Direct-Structured Goal Scene",
            "explanation": "Default state due to inability to parse the API result."
        }

    return result

@shared_task(bind=True, max_retries=3)
def process_message_and_update(self, message_id):
    load_dotenv()
    openai.api_key = os.getenv("OPENAI_API_KEY")
    if not openai.api_key:
        logger.error("OpenAI API key not found inside task.")
        raise ValueError("OpenAI API key not found inside task.")

    try:
        msg = ConversationMessage.objects.get(id=message_id)
        if msg.status in ('killed', 'errored'):
            logger.info(f"Skipping message {message_id} with status {msg.status}")
            return

        current_prompt = SYSTEM_PROMPT
        messages = [
            {"role": "system", "content": current_prompt},
            {"role": "user", "content": f"New message: {msg.message}"}
        ]
        max_iterations = 5

        tools = [
            {
                "type": "function",
                "function": {
                    "name": "fetch_conversation_history_from_api",
                    "description": "Fetch recent conversation history from the API.",
                    "parameters": {
                        "type": "object",
                        "properties": {"limit": {"type": "integer", "description": "Number of recent messages"}},
                        "required": ["limit"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "rephrase_for_tts",
                    "description": "Rephrase a summary into a conversational, TTS-friendly response.",
                    "parameters": {
                        "type": "object",
                        "properties": {"initial_response": {"type": "string", "description": "The initial summary to rephrase"}},
                        "required": ["initial_response"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "decide_next_message_state",
                    "description": "Decide the next conversation state based on summary and current message.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "conversation_summary": {"type": "string", "description": "Summary of previous conversation"},
                            "current_message": {"type": "string", "description": "The current user message"}
                        },
                        "required": ["conversation_summary", "current_message"]
                    }
                }
            }
        ]

        for iteration in range(max_iterations):
            msg.refresh_from_db()
            if msg.status in ('errored', 'killed'):
                logger.info(f"Message {message_id} status changed to {msg.status}, aborting")
                break

            msg.ai_action_log = 'agent-thinks'
            msg.save()
            response_message = call_agent(messages, tools)

            if "function_call" in response_message:
                function_name = response_message["function_call"]["name"]
                tool_call_id = response_message["function_call"]["tool_call_id"]  # Use the correct tool_call_id
                try:
                    args = json.loads(response_message["function_call"]["arguments"])
                except json.JSONDecodeError:
                    logger.warning(f"Invalid function arguments: {response_message['function_call']['arguments']}")
                    args = {"limit": 5} if function_name == "fetch_conversation_history_from_api" else {"initial_response": ""}

                messages.append({
                    "role": "assistant",
                    "content": None,
                    "tool_calls": [{
                        "id": tool_call_id,
                        "function": {
                            "name": function_name,
                            "arguments": json.dumps(args)
                        },
                        "type": "function"
                    }]
                })

                if function_name == "fetch_conversation_history_from_api":
                    msg.refresh_from_db()
                    if msg.status in ('errored', 'killed'):
                        break
                    msg.ai_action_log = 'get-message-history'
                    msg.save()
                    limit = args.get("limit", 5)
                    history = fetch_conversation_history_from_api(limit)
                    history_str = json.dumps(history) if not isinstance(history, dict) else json.dumps({"error": history["error"]})
                    current_prompt = SYSTEM_PROMPT + history_str

                    print(f"CURRENT_PROMPT: {current_prompt}")

                    messages[0] = {"role": "system", "content": current_prompt}
                    messages.append({
                        "role": "tool",
                        "content": history_str,
                        "tool_call_id": tool_call_id
                    })
                elif function_name == "rephrase_for_tts":
                    msg.refresh_from_db()
                    if msg.status in ('errored', 'killed'):
                        break
                    msg.ai_action_log = 'agent-thinks'
                    msg.save()
                    initial_response = args.get("initial_response", "")
                    rephrased_response = rephrase_for_tts(initial_response)
                    messages.append({
                        "role": "tool",
                        "content": json.dumps({"rephrased": rephrased_response}),
                        "tool_call_id": tool_call_id
                    })
                elif function_name == "decide_next_message_state":
                    msg.refresh_from_db()
                    if msg.status in ('errored', 'killed'):
                        break
                    msg.ai_action_log = 'scene'
                    msg.save()
                    conversation_summary = args.get("conversation_summary", "")
                    current_message = args.get("current_message", msg.message)
                    state_result = decide_next_message_state(conversation_summary, current_message)
                    try:
                        msg.scene = state_result["recommended_state"]  # Update the scene state
                        msg.save()
                    except: continue
                    messages.append({
                        "role": "tool",
                        "content": json.dumps(state_result),
                        "tool_call_id": tool_call_id
                    })
                else:
                    logger.warning(f"Unknown function called: {function_name}")
                    break
            elif "content" in response_message:
                content = response_message["content"]
                logger.info(f"Processing content: {content}")
                try:
                    result = json.loads(content)
                    if "final_answer" in result:
                        msg.refresh_from_db()
                        if msg.status in ('errored', 'killed'):
                            break
                        msg.ai_response = result["final_answer"]
                        msg.ai_action_log = 'final-answer'
                        msg.status = 'finished'
                        msg.save()
                        logger.info(f"Final answer saved: {result['final_answer']}")
                        break
                except json.JSONDecodeError:
                    json_match = re.search(r'\{.*final_answer.*\}', content)
                    if json_match:
                        try:
                            result = json.loads(json_match.group(0))
                            if "final_answer" in result:
                                msg.refresh_from_db()
                                if msg.status in ('errored', 'killed'):
                                    break
                                msg.ai_response = result["final_answer"]
                                msg.ai_action_log = 'final-answer'
                                msg.status = 'finished'
                                msg.save()
                                logger.info(f"Final answer saved: {result['final_answer']}")
                                break
                        except json.JSONDecodeError:
                            logger.warning(f"Failed to parse JSON substring: {json_match.group(0)}")
                    messages.append({"role": "assistant", "content": content})
            else:
                break
        else:
            logger.warning(f"Max iterations reached for message {message_id}")
            msg.refresh_from_db()
            if msg.status not in ('errored', 'killed'):
                msg.status = 'errored'
                msg.ai_action_log = 'agent-thinks'
                msg.save()
            return

    except ConversationMessage.DoesNotExist:
        logger.warning(f"Message {message_id} not found")
    except Exception as e:
        logger.error(f"Error processing message {message_id}: {str(e)}")
        try:
            self.retry(exc=e, countdown=5)
        except MaxRetriesExceededError:
            msg.refresh_from_db()
            if msg.status not in ('errored', 'killed'):
                msg.status = 'errored'
                msg.ai_action_log = 'agent-thinks'
                msg.save()
