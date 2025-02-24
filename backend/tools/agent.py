import openai
import json

def call_agent(messages, tools, logger):
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

def call_agent_no_tools(messages, logger):
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
