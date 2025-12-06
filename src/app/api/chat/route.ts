import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, model, systemPrompt, apiKey, showReasoning } = body;

  // Prepare payload for Python backend
  // The backend expects 'query' (last message) and 'conversation_history'
  const lastMessage = messages[messages.length - 1];
  
  // Handle lastMessage.content being parts array or string
  let queryContent = '';
  if (typeof lastMessage.content === 'string') {
    queryContent = lastMessage.content;
  } else if (Array.isArray(lastMessage.parts)) {
    // UI Message format uses 'parts'
    queryContent = lastMessage.parts
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text)
      .join('');
  } else if (lastMessage.text) {
    // Direct text property from sendMessage({ text: ... })
    queryContent = lastMessage.text;
  }

  const history = messages.slice(0, -1).map((m: any) => {
    let content = '';
    if (typeof m.content === 'string') {
      content = m.content;
    } else if (Array.isArray(m.parts)) {
      content = m.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('');
    }
    return { role: m.role, content };
  });

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  if (!backendUrl) {
    return new Response("Backend URL not configured", { status: 500 });
  }

  const encoder = new TextEncoder();
  const messageId = `msg_${Date.now()}`;
  const textPartId = `text_${Date.now()}`;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const requestBody: any = {
          query: queryContent,
          conversation_history: history,
        };
        
        if (model) requestBody.custom_model = model;
        if (systemPrompt) requestBody.system_prompt = systemPrompt;
        if (apiKey) requestBody.custom_api_key = apiKey;
        if (showReasoning !== undefined) requestBody.show_reasoning = showReasoning;

        const response = await fetch(`${backendUrl}/api/query/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true"
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", errorText: `Backend error: ${response.status} - ${errorText}` })}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
          return;
        }

        if (!response.body) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", errorText: "No response body from backend" })}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
          return;
        }

        // Send message start
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "start", messageId })}\n\n`));
        
        // Send text start
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text-start", id: textPartId })}\n\n`));

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let metadataToSend: any = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // Keep the last line in buffer if it's incomplete
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.substring(6);
                // Skip empty data lines
                if (!jsonStr.trim()) continue;
                
                const event = JSON.parse(jsonStr);

                if (event.type === 'content') {
                  // Text delta - using UI Message Stream format
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text-delta", id: textPartId, delta: event.data })}\n\n`));
                } else if (event.type === 'metadata') {
                  // Store metadata to send AFTER text is complete
                  metadataToSend = event.data;
                } else if (event.type === 'error') {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", errorText: event.error })}\n\n`));
                }
              } catch (e) {
                console.error('Error parsing SSE JSON:', e, line);
              }
            }
          }
        }
        
        // Send text end
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text-end", id: textPartId })}\n\n`));
        
        // Send metadata AFTER text is complete (so images appear at the end)
        if (metadataToSend) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "data-metadata", data: metadataToSend })}\n\n`));
        }
        
        // Send finish message
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "finish" })}\n\n`));
        
        // Send done marker
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        
        controller.close();
      } catch (error: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", errorText: error.message || "Unknown error" })}\n\n`));
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "x-vercel-ai-ui-message-stream": "v1"
    },
  });
}
