import 'dotenv/config';
import { App } from '@tinyhttp/app';
import { logger } from '@tinyhttp/logger';
import { Liquid } from 'liquidjs';
import sirv from 'sirv';

// Haal de API-sleutel op uit .env
const apiKey = process.env.API_KEY;

const apiUrl = 'https://api.unsplash.com/photos?client_id=' + apiKey + '&per_page=30&order_by=latest';

// Maak een Liquid Engine voor rendering van templates
const engine = new Liquid({
  extname: '.liquid',
});

const app = new App();

// Logger en statische bestanden
app
  .use(logger())
  .use('/', sirv(process.env.NODE_ENV == 'development' ? 'client' : 'dist')) // Zorg ervoor dat 'dist' de juiste map is
  .listen(3000, () => console.log('Server available on http://localhost:3000'));

// Render functie voor Liquid templates
const renderTemplate = (template, data) => {
  const templateData = {
    NODE_ENV: process.env.NODE_ENV || 'production',
    ...data
  };

  return engine.renderFileSync(template, templateData);
};

// Hoofdpagina route
app.get('/', async (req, res) => {
  const response = await fetch(apiUrl); // Gebruik de ingebouwde fetch van Node.js
  const jsonData = await response.json();

  return res.send(renderTemplate('server/views/index.liquid', { title: 'Home', photos: jsonData }));
});

// Gebruikerspagina route
app.get('/users/:username', async (req, res) => {
  const username = req.params.username;
  const usersAPIEndpoint = `https://api.unsplash.com/users/${username}?client_id=${apiKey}`;
  const userPhotosAPIEndpoint = `https://api.unsplash.com/users/${username}/photos?client_id=${apiKey}`;

  const userResponse = await fetch(usersAPIEndpoint);
  const userData = await userResponse.json();
  const photosResponse = await fetch(userPhotosAPIEndpoint);
  const userPhotos = await photosResponse.json();

  const fullUserData = {
    title: `${userData.name}'s Profile`,
    profile: userData,
    photos: userPhotos,
  };

  return res.send(renderTemplate('server/views/detail.liquid', fullUserData));
});


