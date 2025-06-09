from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import (
    groq,
    cartesia,
    deepgram,
    noise_cancellation,
    silero,
)
from livekit.plugins.turn_detector.multilingual import MultilingualModel

load_dotenv()

class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=(
                "You are a friendly, knowledgeable travel guide for Toronto. "
                "Greet users briefly, don't take too long and then prompt them for what they want."
                "Use a warm, local tone."
                "Only answer questions related to travel in Toronto. "
                "Do not spell out or include punctuation marks, special characters, or symbols (such as asterisks, commas, periods, etc.), just use natural speech."
            )
        )

    async def get_toronto_weather(self):
        # Call a weather API (e.g., OpenWeatherMap)
        import requests
        api_key = "c8b426a41fde538d29083552e151360c"
        url = f"https://api.openweathermap.org/data/2.5/weather?q=Toronto,CA&appid={api_key}&units=metric"
        resp = requests.get(url).json()
        temp = resp["main"]["temp"]
        desc = resp["weather"][0]["description"]
        return f"The current weather in Toronto is {temp} degrees Celsius with {desc}."

    async def on_message(self, message, context):
        if "weather" in text:
            return await self.get_toronto_weather()
        elif "event" in text or "what's happening" in text:
            return await self.get_toronto_events()
        # fallback to LLM
        return await super().on_message(message, context)
        return response

    async def on_session_end(self, context):
        return "Thanks for chatting! Enjoy your time in Toronto."


async def entrypoint(ctx: agents.JobContext):
    session = AgentSession(
        stt=deepgram.STT(model="nova-3", language="multi"),
        llm=groq.LLM(model="llama3-70b-8192"),  # Use a Groq-supported model
        tts=cartesia.TTS(model="sonic-2", voice="7b2c0a2e-3dd3-4a44-b16b-26ecd8134279"),
        vad=silero.VAD.load(),
        turn_detection=MultilingualModel(),
    )
    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )
    await ctx.connect()
    await session.generate_reply(
        instructions="Greet the user and offer your assistance."
    )

if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
