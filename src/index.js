import Hapi from 'hapi';
import Config from 'config';
import chalk from 'chalk';
import { scheduler } from './app/wechatApi/utils';

const server = new Hapi.Server();

server.connection({
  host: Config.get('server.host'),
  port: Config.get('server.port'),
});

server.on('log', (event, tags) => {
  const {
    data: { msg, color },
  } = event;
  const tagsKeys = Object.keys(tags);
  switch (tagsKeys[1]) {
    case 'error': {
      console.log(
        chalk[color || 'red'](`[${tagsKeys[0]}]|[${tagsKeys[1]}], ${msg}`),
      );
      break;
    }
    default: {
      console.log(
        chalk[color || 'blue'](`[${tagsKeys[0]}]|[${tagsKeys[1]}], ${msg}`),
      );
      break;
    }
  }
});

const init = async () => {
  try {
    await server.register([
      require('hapi-async-handler'),
      {
        register: require('./vendor/mongodbCon'),
        options: {
          host: Config.get('db.host'),
          port: Config.get('db.port'),
          db_name: Config.get('db.db_name'),
        },
      },
      require('./app/sendMsg/routes'),
      require('./app/wechatApi/routes'),
    ]);
    await server.start();
    scheduler();
  } catch (err) {
    server.log(['server', 'error'], { msg: err.message });
    process.exit(1);
  }

  server.log(['server', 'info'], {
    msg: `🚀 server running at: , ${server.info.uri}`,
    color: 'green',
  });
};

init();
