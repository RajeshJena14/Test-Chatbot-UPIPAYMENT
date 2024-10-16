// SERVER URL = https://mixed-married-gray.glitch.me

import express from "express";
import axios from "axios";

let currAction
let accountList = [
  {
    accn: "425263",
    name: "Rahul Kumar",
    bill: "₹1500.00",
    month: "July 2024",
    status: "paid",
  },
  {
    accn: "256246",
    name: "N Sankar",
    bill: "₹10.00",
    month: "July 2024",
    status: "unpaid",
  },
  {
    accn: "548523",
    name: "Abhinav Mishra",
    bill: "₹1155.00",
    month: "July 2024",
    status: "unpaid",
  }
]

const sendWhatsAppConfirmation = async (amountPaid, business_phone_number_id,message) => {
  try {
    const response = await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      },
      data: {
        messaging_product: 'whatsapp',
        to: message.from,
        text: {
          body: `Thank you for your payment of ₹${amountPaid}. Your bill has been successfully paid!`,
        },
      },
    });
    console.log('WhatsApp message sent successfully:', response.data);
  }
  catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
};

const RAZORPAYSTATUS = (message,business_phone_number_id) => {
  app.post('/razorpay-webhook', async(req, res) => {
    const event = await req.body.event;
    const paymentDetails = await req.body.payload.payment.entity;
    console.log("Using Razorpay!!!")
    console.log(event)
    if (event === 'payment.captured') {
      const amountPaid = paymentDetails.amount / 100;
      sendWhatsAppConfirmation(amountPaid, business_phone_number_id,message);
    }
    else {
      console.log('Event not handled');
    }
  });
}

const UPIPAYMENT = async(interactiveReply,message,account,business_phone_number_id) => {
  await axios({
    method: "POST",
    url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
    headers: {
      Authorization: `Bearer ${GRAPH_API_TOKEN}`,
    },
    data: {
      messaging_product: "whatsapp",
      to: message.from,
      type: "interactive",
      interactive: {
        "type": "cta_url",
        "header": {
          "type": "image",
          "image": {
            "link": "https://play-lh.googleusercontent.com/JAd53o5wABDZpyRRM7ONKwbuFWhFVTq9nBju5esudFpFAZCosxwgs2xAKTBI37HiiQQ",
          }
        },
        "body": {
          "text": `You are all set to pay your ${accountList.find(a => a.accn === account).month} electricity bill for account *${account}*.\n\nBill Amt .: *${accountList.find(a => a.accn === account).bill}*\n\nPayment will be sent to TPDOCL.\n`
        },
        footer: {
          text: "You will be redirected to Razorpay for secure payment."
        },
        "action": {
          "name": "cta_url",
          "parameters": {
            "display_text": "Proceed to Pay",
            "url": "https://razorpay.me/@civiccraftonlinesolutionspriv"
          }
        }
      },
    },
  })
  .then(()=>{
    setTimeout(() => {
      RAZORPAYSTATUS(message,business_phone_number_id)
    }, 60000);
  })
  await axios({
    method: "POST",
    url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
    headers: {
      Authorization: `Bearer ${GRAPH_API_TOKEN}`,
    },
    data: {
      messaging_product: "whatsapp",
      status: "read",
      message_id: message.id,
    },
  });
}
const OTHEROPTIONS = async(interactiveReply,message,business_phone_number_id) => {
  await axios({
    method: "POST",
    url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
    headers: {
      Authorization: `Bearer ${GRAPH_API_TOKEN}`,
    },
    data: {
      messaging_product: "whatsapp",
      to: message.from,
      text: { body: "You Clicked On " + interactiveReply.title},
      context: {
        message_id: message.id, // shows the message as a reply to the original user message
      },
    },
  });
  await axios({
    method: "POST",
    url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
    headers: {
      Authorization: `Bearer ${GRAPH_API_TOKEN}`,
    },
    data: {
      messaging_product: "whatsapp",
      status: "read",
      message_id: message.id,
    },
  });
}

const app = express();
app.use(express.json());

const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN, PORT } = process.env;

app.post("/webhook", async (req, res) => {
  // log incoming messages
  console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));

  // check if the webhook request contains a message
  // details on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];

  // check if the incoming message contains text
  if (message?.type === "text") {
    if(message.text.body === "Hi") {
    // extract the business number to send the reply from it
      const business_phone_number_id =
        req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;

      // send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          to: message.from,
          text: { body: "Echo Rajesh: " + message.text.body },
          context: {
            message_id: message.id, // shows the message as a reply to the original user message
          },
        },
      });

      // mark incoming message as read
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          status: "read",
          message_id: message.id,
        },
      });
    }
    else if(message.text.body === "start" || message.text.body === "START" || message.text.body === "Start") {
    // extract the business number to send the reply from it
      const business_phone_number_id =
        req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;

      // send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          to: message.from,
          text: { body: "Enter your Account No. mentioned in your Electricity Bill" },
        },
      });

      // mark incoming message as read
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          status: "read",
          message_id: message.id,
        },
      });
    }
    else if(accountList.map(a => a.accn).includes(`${message.text.body}`)) {
    // extract the business number to send the reply from it
      const business_phone_number_id =
        req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;

      currAction = message.text.body
      // send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
      if(accountList.find(a => a.accn === message.text.body).status === "unpaid") {
        await axios({
          method: "POST",
          url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
          headers: {
            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
          },
          data: {
            messaging_product: "whatsapp",
            to: message.from,
            "type": "interactive",
            "interactive": {
              "type": "button",
              "header": {
                "type":"text",
                "text": "Electricity Bill"
              },
              "body": {
                "text": `Account No.: ${message.text.body}\nName: ${accountList.find(a => a.accn === message.text.body).name}\n\nChoose Your Payment Method`
              },
              "action": {
                "buttons": [
                  {
                    "type": "reply",
                    "reply": {
                      "id": "pay-upi",
                      "title": "Pay using UPI"
                    }
                  },
                  {
                    // INTERACTIVE LIST TYPE
                    "type": "reply",
                    "reply": {
                      "id": "other-options",
                      "title": "Other Payment Option"
                    }
                  }
                ]
              }
            },
            context: {
              message_id: message.id, // shows the message as a reply to the original user message
            },
          },
        });

        // mark incoming message as read
        await axios({
          method: "POST",
          url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
          headers: {
            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
          },
          data: {
            messaging_product: "whatsapp",
            status: "read",
            message_id: message.id,
          },
        });
      }
      else if(accountList.find(a => a.accn === message.text.body).status === "paid") {
        await axios({
          method: "POST",
          url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
          headers: {
            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
          },
          data: {
            messaging_product: "whatsapp",
            to: message.from,
            text: { body: `Account No.: ${message.text.body}\nName: ${accountList.find(a => a.accn === message.text.body).name}\n\nYour Electricity Bill for the month ${accountList.find(a => a.accn === message.text.body).month} is PAID.` },
            context: {
              message_id: message.id, // shows the message as a reply to the original user message
            },
          },
        });

        // mark incoming message as read
        await axios({
          method: "POST",
          url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
          headers: {
            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
          },
          data: {
            messaging_product: "whatsapp",
            status: "read",
            message_id: message.id,
          },
        });
      }
    }
  }
  else if (message?.type === "interactive") {
    // extract the business number to send the reply from it
    const business_phone_number_id =
      req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;
    
    const interactiveReply = message.interactive.button_reply;

    if (interactiveReply.id === 'pay-upi') {
      UPIPAYMENT(interactiveReply,message,currAction,business_phone_number_id)
    }
    else if (interactiveReply.id === 'other-options') {
      OTHEROPTIONS(interactiveReply,message,business_phone_number_id)
    }
  }
  res.sendStatus(200);
});

// accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // check the mode and token sent are correct
  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    // respond with 200 OK and challenge token from the request
    res.status(200).send(challenge);
    console.log("Webhook verified successfully!");
  } else {
    // respond with '403 Forbidden' if verify tokens do not match
    res.sendStatus(403);
  }
});

app.get("/", (req, res) => {
  res.send(`<pre>Nothing to see here.
Checkout README.md to start.</pre>`);
});

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});