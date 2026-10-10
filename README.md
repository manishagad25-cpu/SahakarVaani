\# SahakarVaani



\### Voice-First Cooperative Gig Services Platform



SahakarVaani is a web-based platform designed to connect households with local service workers through a simple and accessible booking process. It aims to support cooperative gig work by making service requests, worker allocation, booking status, and welfare-related information easier to manage.



\## Features



\* \*\*User Registration and Login:\*\* Separate access for different user roles.

\* \*\*Service Booking:\*\* A platform for customers to request services.

\* \*\*Worker Dashboard:\*\* Helps workers view and manage their bookings.

\* \*\*Booking Status:\*\* Displays booking progress.

\* \*\*Fair Worker Allocation:\*\* Supports a more balanced approach to assigning work.

\* \*\*Payments:\*\* Includes a payment management interface.

\* \*\*Welfare Management:\*\* Provides welfare-related information and records.

\* \*\*Admin Dashboard:\*\* Helps administrators manage platform activities.

\* \*\*Federation Dashboard:\*\* Supports cooperative-level monitoring.

\* \*\*Demand Forecasting:\*\* Includes a page for viewing demand forecasts.

\* \*\*Language Support:\*\* Includes Tamil and English language support in the interface.



\## Technology Stack



\*\*Frontend\*\*



\* React

\* TypeScript

\* Vite

\* Tailwind CSS



\*\*Backend\*\*



\* Python

\* Flask

\* SQLite

\* Flask-CORS



\## Project Structure



```text

forge/

├── backend/

│   ├── app/

│   │   ├── auth.py

│   │   ├── database.py

│   │   ├── main.py

│   │   ├── models.py

│   │   └── schemas.py

│   └── requirements.txt

├── frontend/

│   ├── src/

│   ├── public/

│   ├── package.json

│   └── vite.config.ts

├── .gitignore

└── README.md

```



\## Prerequisites



Install the following before running the project:



\* Python

\* Node.js and npm

\* Git



\## Run Locally



\### 1. Clone the repository



```bash

git clone YOUR\_GITHUB\_REPOSITORY\_URL

cd forge

```



Replace `YOUR\_GITHUB\_REPOSITORY\_URL` with your repository URL.



\### 2. Start the backend



Open a terminal in the project folder and run:



```powershell

cd backend

python -m venv venv

.\\venv\\Scripts\\Activate.ps1

python -m pip install -r requirements.txt

python -m flask --app app.main run --debug --port 8000

```



The backend should run at:



http://127.0.0.1:8000



\### 3. Start the frontend



Open a second terminal in the project folder and run:



```powershell

cd frontend

npm install

npm run dev

```



Open the local URL shown in the terminal, usually:



http://localhost:5173



Keep both terminals running while using the application.



\## Database



The backend uses SQLite for local data storage. The database file is excluded from Git to avoid uploading local or test data. A local database may be created or initialized according to the backend implementation.



\## Current Status



SahakarVaani is under development. Some features may require further testing and integration before they are ready for production use.



\## Future Improvements



\* Improve voice-based booking and accessibility.

\* Test registration, login, and booking workflows.

\* Strengthen validation and error handling.

\* Improve worker allocation and demand forecasting.

\* Add deployment configuration and automated tests.



\## Contributing



Suggestions and contributions to improve the platform are welcome.



\## License



No license has been specified yet.



