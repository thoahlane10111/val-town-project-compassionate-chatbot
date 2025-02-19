/** @jsxImportSource https://esm.sh/react@18.2.0 */
import { createRoot } from "https://esm.sh/react-dom@18.2.0/client";
import React, { useEffect, useState } from "https://esm.sh/react@18.2.0";

const CRISIS_RESOURCES = {
  US: {
    name: "National Suicide Prevention Lifeline",
    phone: "+266 2231 2767",
    website: "https://progress.guide/atlas/africa/lesotho/",
  },
  Global: {
    name: "International Help Resources",
    website: "https://www.befrienders.org/",
  },
};

function SupportChatbot() {
  const [messages, setMessages] = useState([
    {
      text: "Hello, I'm here to listen. How are you feeling today?",
      sender: "bot",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const addMessage = (text, sender) => {
    setMessages(prev => [...prev, { text, sender }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    addMessage(userInput, "user");
    setUserInput("");
    setIsProcessing(true);

    try {
      const response = await fetch("/support-chat", {
        method: "POST",
        body: JSON.stringify({
          messages: messages.concat({ text: userInput, sender: "user" }),
        }),
      });

      const data = await response.json();
      addMessage(data.response, "bot");
    } catch (error) {
      addMessage("I'm having trouble responding right now. Are you okay?", "bot");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="support-chat">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Share your thoughts..."
          disabled={isProcessing}
        />
        <button type="submit" disabled={isProcessing}>
          {isProcessing ? "..." : "Send"}
        </button>
      </form>
      <div className="crisis-resources">
        <h3>🚨 Emergency Resources</h3>
        {Object.values(CRISIS_RESOURCES).map(resource => (
          <div key={resource.name}>
            <strong>{resource.name}</strong>
            {resource.phone && <p>📞 Call: {resource.phone}</p>}
            {resource.website && <a href={resource.website} target="_blank">🌐 Website</a>}
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <div>
      <h1>💖 Compassionate Support Chat</h1>
      <SupportChatbot />
    </div>
  );
}

function client() {
  createRoot(document.getElementById("root")).render(<App />);
}
if (typeof document !== "undefined") { client(); }

export default async function server(request: Request): Promise<Response> {
  if (request.method === "POST") {
    const { OpenAI } = await import("https://esm.town/v/std/openai");
    const openai = new OpenAI();

    const body = await request.json();
    const conversationHistory = body.messages;

    const systemPrompt = `
      You are a compassionate, empathetic AI counselor designed to provide emotional support.
      Your primary goals are to:
      1. Listen without judgment
      2. Validate the user's feelings
      3. Offer gentle, constructive support
      4. Recognize signs of severe distress and suggest professional help
      5. Maintain a calm, caring tone
      
      IMPORTANT SAFETY GUIDELINES:
      - If user mentions suicide or self-harm, ALWAYS:
        a) Express care and concern
        b) Recommend professional help
        c) Provide crisis resource links
      - Never diagnose or replace professional therapy
      - Encourage seeking professional support
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
        })),
      ],
      max_tokens: 150,
    });

    return Response.json({
      response: response.choices[0].message.content,
    });
  }

  return new Response(
    `
    <html>
      <head>
        <title>Compassionate Support Chat</title>
        <style>${css}</style>
      </head>
      <body>
        <div id="root"></div>
        <script src="https://esm.town/v/std/catch"></script>
        <script type="module" src="${import.meta.url}"></script>
      </body>
    </html>
  `,
    {
      headers: { "content-type": "text/html" },
    },
  );
}

const css = `
body {
  font-family: system-ui, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f4f4f4;
}

.support-chat {
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  padding: 20px;
}

.chat-messages {
  height: 400px;
  overflow-y: auto;
  border-bottom: 1px solid #eee;
}

.message {
  margin: 10px 0;
  padding: 10px;
  border-radius: 5px;
}

.message.bot {
  background-color: #e6f2ff;
  text-align: left;
}

.message.user {
  background-color: #f0f0f0;
  text-align: right;
}

.crisis-resources {
  margin-top: 20px;
  background-color: #fff0f0;
  padding: 15px;
  border-radius: 5px;
}

form {
  display: flex;
  margin-top: 20px;
}

input {
  flex-grow: 1;
  padding: 10px;
  margin-right: 10px;
}

button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
}
`;