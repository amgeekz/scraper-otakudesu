const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Otakudesu REST API',
      version: '1.0.0',
      description: 'API for scraping anime data from Otakudesu.blog',
      contact: {
        name: 'API Support',
        email: 'support@otakudesu-api.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'https://otakudesu-api.vercel.app',
        description: 'Production Server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development Server'
      }
    ],
    tags: [
      { name: 'Anime', description: 'Anime endpoints' },
      { name: 'Episodes', description: 'Episode endpoints' },
      { name: 'Search', description: 'Search endpoints' },
      { name: 'Genre', description: 'Genre endpoints' }
    ],
    components: {
      schemas: {
        Anime: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            link: { type: 'string' },
            image: { type: 'string' },
            episode: { type: 'string' },
            date: { type: 'string' }
          }
        },
        AnimeDetail: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            image: { type: 'string' },
            synopsis: { type: 'string' },
            info: { type: 'object' },
            episodes: { type: 'array' }
          }
        },
        Response: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

module.exports = swaggerJsdoc(options);
