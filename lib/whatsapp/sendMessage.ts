export async function sendWhatsAppMessage({
  accessToken,
  phoneNumberId,
  to,
  message,
  apiVersion = process.env.META_GRAPH_API_VERSION || "v19.0"
}: {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  message: string;
  apiVersion?: string;
}) {
  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: message
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp send failed: ${response.status} ${errorText}`);
  }

  return response.json();
}
