const fs = require('fs');

const imagePath = '/Users/sanjeevgulati/personal-repos/ai-teacher/server/samplerequest/WhatsApp Image 2025-11-29 at 12.52.50 PM.jpeg';
const imageBuffer = fs.readFileSync(imagePath);
const base64Image = imageBuffer.toString('base64');

const payload = {
    model: "llava:13b",
    messages: [
        {
            role: "user",
            content: [
                { type: "text", text: "What do you see in this image? Describe it in detail." },
                {
                    type: "image_url",
                    image_url: {
                        url: `data:image/jpeg;base64,${base64Image}`
                    }
                }
            ]
        }
    ],
    max_tokens: 500
};

fetch('http://localhost:11434/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => {
    console.log('Response:', JSON.stringify(data, null, 2));
})
.catch(err => {
    console.error('Error:', err);
});
