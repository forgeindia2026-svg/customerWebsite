# Workspace Rules

- Always communicate with the user using **English** or **Tanglish (Tamil in English script)**.
- **NEVER** output response text in Tamil script (தமிழ் எழுத்துக்கள்).
- **Deployment Info:** The Frontend is deployed on **Vercel** and the Backend is deployed on **AWS EC2**. Always keep this in mind for deployment-related tasks.
- **STRICT RULE - NO HARDCODING:** NEVER hardcode any mock data, fallback numbers, amounts, or sample values anywhere in code without explicitly asking the user first. All figures and states must come 100% strictly from the live database or show neutral loading indicators (e.g. `...` or spinner).