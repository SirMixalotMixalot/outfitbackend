# Ouffix Backend

The backend for the revolutionary outfit generation and curation app, [ouffix](https://ouffix.com) 🚀

## Contributing 

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.
## Installation/Running The Server Locally 📍

Clone the repository
```bash
git clone https://github.com/SirMixalotMixalot/outfitbackend.git
```
Add the .env file containing the API keys 
```bash
cp <PATH_TO_ENV_FILE> ./outfitbackend
```
Install the dependencies
```bash
npm i 
```
Run the server!
```bash
npm run dev
```
## Structure
This repository follows a standard structure for organizing an Express.js server application. The structure is designed to maintain modularity📦, enhance readability 📖, and facilitate scalability 📈.

#### Models 🗃️:

Contains files defining data structures and interactions with the database.

#### Routers 🛣️:

Contains route definitions and endpoint handling.
Organizes routes based on different resources or functionalities.

#### Controllers 🌉:

Houses the logic for handling HTTP requests and responses.
Controls the flow of data and orchestrates interactions between models and routers.

#### Helpers:

Contains utility functions or modules used across different parts of the application.

## License

[MIT](https://choosealicense.com/licenses/mit/)
